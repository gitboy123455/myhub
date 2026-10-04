import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { type MetaFunction } from "react-router";

type V86StarterLike = {
	stop?: () => void;
	run?: () => void;
	restart?: () => void;
	destroy?: () => void;
};

type V86Constructor = new (options: Record<string, unknown>) => V86StarterLike;

declare global {
	interface Window {
		V86Starter?: V86Constructor;
	}
}

const DEFAULT_V86_SCRIPT = "https://cdn.jsdelivr.net/npm/v86@latest/build/libv86.js";

export const meta: MetaFunction = () => [
	{ title: "MyHub | x86 Emulator" },
	{
		name: "description",
		content: "Configure a browser-side v86 integration boundary for x86 BIOS and disk-image testing.",
	},
];

function isSafeUrl(value: string) {
	if (!value.trim()) {
		return false;
	}
	try {
		const parsed = new URL(value);
		return parsed.protocol === "https:" || parsed.protocol === "http:" || parsed.protocol === "blob:";
	} catch {
		return false;
	}
}

export default function X86Emulator() {
	const [biosUrl, setBiosUrl] = useState("");
	const [vgaBiosUrl, setVgaBiosUrl] = useState("");
	const [diskUrl, setDiskUrl] = useState("");
	const [status, setStatus] = useState("Configure assets and start a browser-side v86 session.");
	const [error, setError] = useState("");
	const [isBooting, setIsBooting] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [diskFileName, setDiskFileName] = useState("");

	const diskObjectUrlRef = useRef<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const emulatorRef = useRef<V86StarterLike | null>(null);
	const scriptRef = useRef<HTMLScriptElement | null>(null);

	const selectedDiskSource = useMemo(() => diskObjectUrlRef.current ?? diskUrl.trim(), [diskUrl, diskFileName]);

	const releaseDiskObjectUrl = () => {
		if (!diskObjectUrlRef.current) {
			return;
		}
		URL.revokeObjectURL(diskObjectUrlRef.current);
		diskObjectUrlRef.current = null;
	};

	useEffect(() => {
		return () => {
			try {
				emulatorRef.current?.destroy?.();
			} catch {
				// no-op
			}
			emulatorRef.current = null;
			releaseDiskObjectUrl();
			if (scriptRef.current && scriptRef.current.parentNode) {
				scriptRef.current.parentNode.removeChild(scriptRef.current);
				scriptRef.current = null;
			}
		};
	}, []);

	const onDiskFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		releaseDiskObjectUrl();
		setDiskFileName("");
		if (!file) {
			return;
		}
		const objectUrl = URL.createObjectURL(file);
		diskObjectUrlRef.current = objectUrl;
		setDiskFileName(file.name);
		setStatus(`Loaded local image: ${file.name}`);
	};

	const loadV86Script = async () => {
		if (typeof window === "undefined") {
			throw new Error("x86 emulator is only available in the browser.");
		}
		if (window.V86Starter) {
			return;
		}

		await new Promise<void>((resolve, reject) => {
			if (scriptRef.current) {
				scriptRef.current.remove();
				scriptRef.current = null;
			}
			const script = document.createElement("script");
			script.src = DEFAULT_V86_SCRIPT;
			script.async = true;
			script.crossOrigin = "anonymous";
			script.onload = () => resolve();
			script.onerror = () => reject(new Error("Could not load v86 script. Check URL and CORS."));
			scriptRef.current = script;
			document.body.appendChild(script);
		});

		if (!window.V86Starter) {
			throw new Error("v86 loaded but V86Starter is unavailable.");
		}
	};

	const onStart = async () => {
		if (!containerRef.current) {
			setError("Display container is unavailable.");
			return;
		}
		if (!isSafeUrl(biosUrl) || !isSafeUrl(vgaBiosUrl) || !isSafeUrl(selectedDiskSource)) {
			setError("Provide valid BIOS, VGA BIOS, and disk image URLs or upload a disk image.");
			return;
		}

		setIsBooting(true);
		setError("");
		setStatus("Loading v86 runtime…");

		try {
			await loadV86Script();
			const V86Starter = window.V86Starter;
			if (!V86Starter) {
				throw new Error("v86 runtime is not available.");
			}

			try {
				emulatorRef.current?.destroy?.();
			} catch {
				// no-op
			}

			emulatorRef.current = new V86Starter({
				wasm_path: "https://cdn.jsdelivr.net/npm/v86@latest/build/v86.wasm",
				memory_size: 256 * 1024 * 1024,
				vga_memory_size: 8 * 1024 * 1024,
				screen_container: containerRef.current,
				bios: { url: biosUrl.trim() },
				vga_bios: { url: vgaBiosUrl.trim() },
				hda: { url: selectedDiskSource },
				autostart: true,
			});

			setIsRunning(true);
			setStatus("Emulator started. Use stop/reset controls as needed.");
		} catch (runtimeError) {
			setIsRunning(false);
			setError(runtimeError instanceof Error ? runtimeError.message : "Unable to start emulator.");
			setStatus("Emulator failed to start.");
		} finally {
			setIsBooting(false);
		}
	};

	const onStop = () => {
		emulatorRef.current?.stop?.();
		setIsRunning(false);
		setStatus("Emulator stopped.");
	};

	const onReset = () => {
		if (!emulatorRef.current) {
			setStatus("Start the emulator first.");
			return;
		}
		emulatorRef.current.restart?.();
		setIsRunning(true);
		setStatus("Reset signal sent to emulator.");
	};

	const onResume = () => {
		emulatorRef.current?.run?.();
		setIsRunning(true);
		setStatus("Emulator resumed.");
	};

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">x86 Emulator</h1>
				<p className="mt-3 max-w-3xl text-base leading-7 text-gray-700 dark:text-gray-300">
					This page provides a safe integration boundary for the open-source v86 project (copy.sh demo ecosystem). Load your own BIOS and OS images, then run them locally in the browser.
				</p>
				<p className="mt-4 text-sm text-gray-700 dark:text-gray-300" role="status" aria-live="polite">
					{status}
				</p>
				{error ? (
					<p className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-200">
						{error}
					</p>
				) : null}
			</section>

			<section className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
				<form className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900" aria-label="x86 emulator configuration">
					<p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-300">
						v86 runtime source: <span className="font-mono">{DEFAULT_V86_SCRIPT}</span>
					</p>
					<div>
						<label htmlFor="bios-url" className="block text-sm font-medium">
							BIOS URL
						</label>
						<input
							id="bios-url"
							type="url"
							value={biosUrl}
							onChange={(event) => setBiosUrl(event.target.value)}
							className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950"
							placeholder="https://example.com/seabios.bin"
						/>
					</div>
					<div>
						<label htmlFor="vga-bios-url" className="block text-sm font-medium">
							VGA BIOS URL
						</label>
						<input
							id="vga-bios-url"
							type="url"
							value={vgaBiosUrl}
							onChange={(event) => setVgaBiosUrl(event.target.value)}
							className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950"
							placeholder="https://example.com/vgabios.bin"
						/>
					</div>
					<div>
						<label htmlFor="disk-url" className="block text-sm font-medium">
							Disk image URL
						</label>
						<input
							id="disk-url"
							type="url"
							value={diskUrl}
							onChange={(event) => setDiskUrl(event.target.value)}
							className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950"
							placeholder="https://example.com/os.img"
						/>
					</div>
					<div>
						<label htmlFor="disk-file" className="block text-sm font-medium">
							Or upload local disk image
						</label>
						<input
							id="disk-file"
							type="file"
							onChange={onDiskFileChange}
							accept=".img,.iso,.bin"
							className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:file:bg-indigo-500/20 dark:file:text-indigo-200"
						/>
						{diskFileName ? <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">Using local image: {diskFileName}</p> : null}
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => void onStart()}
							disabled={isBooting}
							className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white outline-none motion-safe:transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isBooting ? "Starting…" : "Start"}
						</button>
						<button
							type="button"
							onClick={onStop}
							disabled={!emulatorRef.current}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-red-300 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:border-red-300 dark:hover:text-red-300"
						>
							Stop
						</button>
						<button
							type="button"
							onClick={onResume}
							disabled={!emulatorRef.current}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
						>
							Run
						</button>
						<button
							type="button"
							onClick={onReset}
							disabled={!emulatorRef.current}
							className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
						>
							Reset
						</button>
					</div>
				</form>

				<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<div className="rounded-lg border border-gray-200 bg-gray-950 p-2 dark:border-gray-700">
						<div ref={containerRef} className="mx-auto min-h-[380px] w-full overflow-hidden bg-black" aria-label="x86 emulator viewport" />
					</div>
					{!isRunning ? (
						<p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-300">
							Emulator is idle. Provide valid assets and press <strong>Start</strong>. If startup fails in this environment, this page still serves as a stable integration boundary for v86 in supported browsers.
						</p>
					) : null}
				</div>
			</section>

			<section className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
				<h2 className="text-lg font-semibold">Security and licensing notes</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5">
					<li>Only boot BIOS and OS images you have legal rights to use.</li>
					<li>Use trusted URLs. This page accepts only http(s) and blob URLs to reduce unsafe inputs.</li>
					<li>Large images should be hosted with reliable range requests and permissive CORS headers.</li>
					<li>copy.sh is a public demo/reference for v86, not a backend API to scrape or blindly iframe.</li>
				</ul>
			</section>
		</div>
	);
}
