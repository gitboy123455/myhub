import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type MetaFunction } from "react-router";

type SerialPortLike = {
	open(options: { baudRate: number }): Promise<void>;
	close(): Promise<void>;
	readable?: ReadableStream<Uint8Array> | null;
	writable?: WritableStream<Uint8Array> | null;
	getInfo?: () => { usbVendorId?: number; usbProductId?: number };
};

type SerialManagerLike = {
	requestPort(): Promise<SerialPortLike>;
	addEventListener?: (type: "disconnect", listener: EventListener) => void;
	removeEventListener?: (type: "disconnect", listener: EventListener) => void;
};

type SerialEntry = {
	id: number;
	text: string;
	type: "rx" | "tx" | "status" | "error";
};

const MAX_LINES = 500;
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

export const meta: MetaFunction = () => [
	{ title: "MyHub | Serial Monitor" },
	{
		name: "description",
		content: "Use the browser Web Serial API to connect, monitor, and interact with serial devices in MyHub.",
	},
];

export default function SerialMonitor() {
	const [selectedBaudRate, setSelectedBaudRate] = useState(115200);
	const [supported, setSupported] = useState(false);
	const [status, setStatus] = useState("Checking browser support…");
	const [isConnecting, setIsConnecting] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [autoScroll, setAutoScroll] = useState(true);
	const [lineMode, setLineMode] = useState(true);
	const [outgoingText, setOutgoingText] = useState("");
	const [entries, setEntries] = useState<SerialEntry[]>([]);

	const entryId = useRef(0);
	const serialRef = useRef<SerialManagerLike | null>(null);
	const portRef = useRef<SerialPortLike | null>(null);
	const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
	const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
	const readLoopActiveRef = useRef(false);
	const pendingLineRef = useRef("");
	const lineModeRef = useRef(true);
	const consoleRef = useRef<HTMLDivElement | null>(null);

	const addEntry = (type: SerialEntry["type"], text: string) => {
		const timestamp = new Date().toLocaleTimeString();
		setEntries((current) => {
			const nextEntry = {
				id: entryId.current,
				text: `[${timestamp}] ${text}`,
				type,
			};
			entryId.current += 1;
			const next = [...current, nextEntry];
			return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
		});
	};

	const disconnect = useCallback(async (reason?: string) => {
		readLoopActiveRef.current = false;

		if (readerRef.current) {
			try {
				await readerRef.current.cancel();
			} catch {
				// no-op
			}
			readerRef.current.releaseLock();
			readerRef.current = null;
		}

		if (writerRef.current) {
			writerRef.current.releaseLock();
			writerRef.current = null;
		}

		if (portRef.current) {
			try {
				await portRef.current.close();
			} catch {
				// no-op
			}
			portRef.current = null;
		}

		pendingLineRef.current = "";
		setIsConnected(false);
		if (reason) {
			setStatus(reason);
			addEntry("status", reason);
		}
	}, []);

	useEffect(() => {
		lineModeRef.current = lineMode;
	}, [lineMode]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const serialCandidate = (navigator as Navigator & { serial?: SerialManagerLike }).serial;
		serialRef.current = serialCandidate ?? null;

		if (!serialCandidate) {
			setSupported(false);
			setStatus("Web Serial API is not available in this browser.");
			addEntry("error", "Web Serial is unsupported. Use a Chromium-based browser over HTTPS or localhost.");
			return;
		}

		setSupported(true);
		setStatus("Ready. Select a port to begin.");
		addEntry("status", "Web Serial API detected.");

		const onDisconnect = () => {
			void disconnect("Device disconnected.");
		};

		serialCandidate.addEventListener?.("disconnect", onDisconnect);

		return () => {
			serialCandidate.removeEventListener?.("disconnect", onDisconnect);
			void disconnect();
		};
	}, [disconnect]);

	useEffect(() => {
		if (!autoScroll || !consoleRef.current) {
			return;
		}
		consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
	}, [entries, autoScroll]);

	const readLoop = async () => {
		const port = portRef.current;
		if (!port?.readable) {
			return;
		}

		readLoopActiveRef.current = true;
		const decoder = new TextDecoder();
		readerRef.current = port.readable.getReader();

		try {
			while (readLoopActiveRef.current && readerRef.current) {
				const { value, done } = await readerRef.current.read();
				if (done) {
					break;
				}
				if (!value) {
					continue;
				}
				const chunk = decoder.decode(value, { stream: true });
				if (!chunk) {
					continue;
				}

				if (!lineModeRef.current) {
					addEntry("rx", `RX ${chunk}`);
					continue;
				}

				pendingLineRef.current += chunk;
				const split = pendingLineRef.current.split(/\r?\n/);
				pendingLineRef.current = split.pop() ?? "";
				for (const line of split) {
					const trimmed = line.trimEnd();
					if (trimmed.length > 0) {
						addEntry("rx", `RX ${trimmed}`);
					}
				}
			}
		} catch (error) {
			addEntry("error", `Read error: ${error instanceof Error ? error.message : "Unknown serial read failure."}`);
		} finally {
			if (pendingLineRef.current.trim().length > 0) {
				addEntry("rx", `RX ${pendingLineRef.current.trim()}`);
				pendingLineRef.current = "";
			}
			if (readerRef.current) {
				readerRef.current.releaseLock();
				readerRef.current = null;
			}
		}
	};

	const onRequestPort = async () => {
		if (!serialRef.current) {
			setStatus("Web Serial API is unavailable.");
			addEntry("error", "Cannot request a port because the API is unavailable.");
			return;
		}

		setIsConnecting(true);
		try {
			const port = await serialRef.current.requestPort();
			portRef.current = port;
			const info = port.getInfo?.();
			const details =
				info?.usbVendorId || info?.usbProductId
					? `Selected device VID:PID ${info.usbVendorId?.toString(16) ?? "??"}:${info.usbProductId?.toString(16) ?? "??"}`
					: "Serial port selected.";
			setStatus(details);
			addEntry("status", details);
		} catch (error) {
			setStatus("Port selection canceled or denied.");
			addEntry("error", error instanceof Error ? error.message : "Permission denied while selecting serial port.");
		} finally {
			setIsConnecting(false);
		}
	};

	const onConnect = async () => {
		if (!portRef.current) {
			setStatus("Select a port first.");
			addEntry("error", "Connect failed because no serial port is selected.");
			return;
		}

		setIsConnecting(true);
		try {
			await portRef.current.open({ baudRate: selectedBaudRate });
			if (portRef.current.writable) {
				writerRef.current = portRef.current.writable.getWriter();
			}
			setIsConnected(true);
			setStatus(`Connected at ${selectedBaudRate} baud.`);
			addEntry("status", `Connected at ${selectedBaudRate} baud.`);
			void readLoop();
		} catch (error) {
			setIsConnected(false);
			setStatus("Connection failed.");
			addEntry("error", error instanceof Error ? error.message : "Unable to open the selected serial port.");
		} finally {
			setIsConnecting(false);
		}
	};

	const onSend = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = outgoingText.trim();
		if (!text) {
			return;
		}
		if (!writerRef.current) {
			setStatus("Connect before sending text.");
			addEntry("error", "Send failed because no writable stream is available.");
			return;
		}

		try {
			const payload = `${text}\n`;
			await writerRef.current.write(new TextEncoder().encode(payload));
			addEntry("tx", `TX ${text}`);
			setOutgoingText("");
		} catch (error) {
			addEntry("error", error instanceof Error ? error.message : "Failed to send text over serial.");
		}
	};

	const statusClassName = useMemo(() => {
		if (!supported) {
			return "text-amber-700 dark:text-amber-300";
		}
		return isConnected ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300";
	}, [supported, isConnected]);

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Serial Monitor</h1>
				<p className="mt-3 max-w-3xl text-base leading-7 text-gray-700 dark:text-gray-300">
					Connect to a supported serial device with the Web Serial API, stream incoming data, and send quick commands for firmware or IoT debugging.
				</p>
				<p className={`mt-4 text-sm font-medium ${statusClassName}`} role="status" aria-live="polite">
					{status}
				</p>
			</section>

			<section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
				<form className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900" aria-label="Serial connection controls">
					<div>
						<label htmlFor="baud-rate" className="block text-sm font-medium">
							Baud rate
						</label>
						<select
							id="baud-rate"
							value={selectedBaudRate}
							onChange={(event) => setSelectedBaudRate(Number(event.target.value))}
							className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950"
							disabled={!supported || isConnecting || isConnected}
						>
							{BAUD_RATES.map((baudRate) => (
								<option value={baudRate} key={baudRate}>
									{baudRate}
								</option>
							))}
						</select>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => void onRequestPort()}
							disabled={!supported || isConnecting || isConnected}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
						>
							Select port
						</button>
						<button
							type="button"
							onClick={() => void onConnect()}
							disabled={!supported || isConnecting || isConnected || !portRef.current}
							className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white outline-none motion-safe:transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Connect
						</button>
						<button
							type="button"
							onClick={() => void disconnect("Disconnected.")}
							disabled={!isConnected}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-red-300 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:border-red-300 dark:hover:text-red-300"
						>
							Disconnect
						</button>
					</div>
					<div className="space-y-2">
						<label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
							<span>Readable line mode</span>
							<input
								type="checkbox"
								checked={lineMode}
								onChange={(event) => setLineMode(event.target.checked)}
								className="h-4 w-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
							/>
						</label>
						<label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
							<span>Auto-scroll console</span>
							<input
								type="checkbox"
								checked={autoScroll}
								onChange={(event) => setAutoScroll(event.target.checked)}
								className="h-4 w-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
							/>
						</label>
					</div>
					<p className="text-xs text-gray-600 dark:text-gray-300">
						Retains the most recent {MAX_LINES} console lines to avoid unbounded memory growth.
					</p>
				</form>

				<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<form onSubmit={onSend} className="flex flex-col gap-2 sm:flex-row" aria-label="Send serial data">
						<label htmlFor="serial-output" className="sr-only">
							Text to send
						</label>
						<input
							id="serial-output"
							type="text"
							value={outgoingText}
							onChange={(event) => setOutgoingText(event.target.value)}
							placeholder="Type command to send"
							className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950"
							disabled={!isConnected}
						/>
						<button
							type="submit"
							className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white outline-none motion-safe:transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!isConnected || outgoingText.trim().length === 0}
						>
							Send
						</button>
						<button
							type="button"
							onClick={() => setEntries([])}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
						>
							Clear
						</button>
					</form>

					<div
						ref={consoleRef}
						className="h-[360px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-950 p-3 text-xs text-gray-100 dark:border-gray-700"
						role="log"
						aria-live="polite"
						aria-label="Serial console output"
					>
						{entries.length === 0 ? (
							<p className="text-gray-400">No serial data yet. Select a port and connect to begin.</p>
						) : (
							<ul className="space-y-1 font-mono">
								{entries.map((entry) => (
									<li
										key={entry.id}
										className={
											entry.type === "error"
												? "text-red-300"
												: entry.type === "status"
													? "text-blue-300"
													: entry.type === "tx"
														? "text-emerald-300"
														: "text-gray-100"
										}
									>
										{entry.text}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
