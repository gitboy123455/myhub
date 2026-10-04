import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { type MetaFunction } from "react-router";

type EmulatorLike = {
	stop?: () => void;
	run?: () => void;
	restart?: () => void;
	destroy?: () => void;
};

type V86Constructor = new (options: Record<string, unknown>) => EmulatorLike;

declare global {
	interface Window {
		V86?: V86Constructor;
	}
}

const DEFAULT_V86_SCRIPT = "https://cdn.jsdelivr.net/npm/v86@latest/build/libv86.js";
const DEFAULT_V86_WASM = "https://cdn.jsdelivr.net/npm/v86@latest/build/v86.wasm";

export const meta: MetaFunction = () => [
	{ title: "MyHub | x86 Emulator" },
	{
		name: "description",
		content: "Configure a browser-side v86 integration boundary for x86 BIOS and disk-image testing.",
	},
];

function isSafeUrl(value: string) {
	if (!value.trim()) return false;
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
	const [diskFileName, setDiskFileName] = useState("");
	const [status, setStatus] = useState("Configure assets and start a browser-side v86 session.");
	const [error, setError] = useState("");
	const [isBooting, setIsBooting] = useState(false);
	const [isRunning, setIsRunning] = useState(false);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const emulatorRef = useRef<EmulatorLike | null>(null);
	const scriptRef = useRef<HTMLScriptElement | null>(null);
	const diskObjectUrlRef = useRef<string | null>(null);
	const selectedDiskSource = useMemo(
		() => diskObjectUrlRef.current ?? diskUrl.trim(),
		[diskUrl, diskFileName],
	);

	const releaseDiskObjectUrl = () => {
		if (diskObjectUrlRef.current) {
			URL.revokeObjectURL(diskObjectUrlRef.current);
			diskObjectUrlRef.current = null;
		}
	};

	useEffect(() => {
		return () => {
			try {
				emulatorRef.current?.destroy?.();
			} catch {
				// Cleanup should not mask route changes.
			}
			releaseDiskObjectUrl();
			scriptRef.current?.remove();
		};
	}, []);

	const loadV86Script = async () => {
		if (typeof window === "undefined") {
			throw new Error("The x86 emulator is only available in the browser.");
		}
		if (window.V86) return;

		await new Promise<void>((resolve, reject) => {
			const script = document.createElement("script");
			script.src = DEFAULT_V86_SCRIPT;
			script.async = true;
			script.crossOrigin = "anonymous";
			script.onload = () => resolve();
			script.onerror = () => reject(new Error("Could not load libv86.js. Check the runtime URL and network access."));
			scriptRef.current = script;
			document.body.appendChild(script);
		});

		if (!window.V86) {
			throw new Error("libv86.js loaded, but the V86 constructor was not exported.");
		}
	};

	const onDiskFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		releaseDiskObjectUrl();
		const file = event.target.files?.[0];
		setDiskFileName(file?.name ?? "");
		if (file) {
			diskObjectUrlRef.current = URL.createObjectURL(file);
			setStatus(`Loaded local image: ${file.name}`);
		}
	};

	const onStart = async () => {
		if (!containerRef.current) {
			setError("Display container is unavailable.");
			return;
		}
		if (!isSafeUrl(biosUrl) || !isSafeUrl(vgaBiosUrl) || !isSafeUrl(selectedDiskSource)) {
			setError("Provide valid BIOS, VGA BIOS, and disk image URLs, or upload a local image.");
			return;
		}

		setIsBooting(true);
		setError("");
		setStatus("Loading v86 runtime…");

		try {
			await loadV86Script();
			const V86 = window.V86;
			if (!V86) throw new Error("The v86 runtime is not available.");

			emulatorRef.current?.destroy?.();
			containerRef.current.replaceChildren();

			const textScreen = document.createElement("div");
			textScreen.style.whiteSpace = "pre";
			textScreen.style.font = "14px monospace";
			textScreen.style.lineHeight = "14px";
			const canvas = document.createElement("canvas");
			canvas.style.display = "none";
			containerRef.current.append(textScreen, canvas);

			emulatorRef.current = new V86({
				wasm_path: DEFAULT_V86_WASM,
				memory_size: 256 * 1024 * 1024,
				vga_memory_size: 8 * 1024 * 1024,
				screen_container: containerRef.current,
				bios: { url: biosUrl.trim() },
				vga_bios: { url: vgaBiosUrl.trim() },
				hda: { url: selectedDiskSource },
				autostart: true,
			});

			setIsRunning(true);
			setStatus("Emulator started. Use stop, run, or reset as needed.");
		} catch (runtimeError) {
			setIsRunning(false);
			setStatus("Emulator failed to start.");
			setError(runtimeError instanceof Error ? runtimeError.message : "Unable to start emulator.");
		} finally {
			setIsBooting(false);
		}
	};

	const onStop = () => {
		emulatorRef.current?.stop?.();
		setIsRunning(false);
		setStatus("Emulator stopped.");
	};

	const onRun = () => {
		emulatorRef.current?.run?.();
		setIsRunning(true);
		setStatus("Emulator resumed.");
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

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">x86 Emulator</h1>
				<p className="mt-3 max-w-3xl text-base leading-7 text-gray-700 dark:text-gray-300">
					Run legally obtained x86 BIOS and operating-system images in the browser using the v86 runtime used by the copy.sh ecosystem.
				</p>
				<p className="mt-4 text-sm text-gray-700 dark:text-gray-300" role="status" aria-live="polite">{status}</p>
				{error ? <p className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-200">{error}</p> : null}
			</section>

			<section className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
				<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-300">Runtime: <span className="font-mono">{DEFAULT_V86_SCRIPT}</span></p>
					<label className="block text-sm font-medium">BIOS URL<input type="url" value={biosUrl} onChange={(event) => setBiosUrl(event.target.value)} placeholder="https://example.com/seabios.bin" className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950" /></label>
					<label className="block text-sm font-medium">VGA BIOS URL<input type="url" value={vgaBiosUrl} onChange={(event) => setVgaBiosUrl(event.target.value)} placeholder="https://example.com/vgabios.bin" className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950" /></label>
					<label className="block text-sm font-medium">Disk image URL<input type="url" value={diskUrl} onChange={(event) => setDiskUrl(event.target.value)} placeholder="https://example.com/os.img" className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950" /></label>
					<label className="block text-sm font-medium">Or upload local disk image<input type="file" accept=".img,.iso,.bin" onChange={onDiskFileChange} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:file:bg-indigo-500/20 dark:file:text-indigo-200" />{diskFileName ? <span className="mt-2 block text-xs text-gray-600 dark:text-gray-300">Using local image: {diskFileName}</span> : null}</label>
					<div className="flex flex-wrap gap-2">
						<button type="button" onClick={() => void onStart()} disabled={isBooting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60">{isBooting ? "Starting…" : "Start"}</button>
						<button type="button" onClick={onStop} disabled={!emulatorRef.current} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-red-300 hover:text-red-600 disabled:opacity-60 dark:border-gray-700">Stop</button>
						<button type="button" onClick={onRun} disabled={!emulatorRef.current} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-60 dark:border-gray-700">Run</button>
						<button type="button" onClick={onReset} disabled={!emulatorRef.current} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-60 dark:border-gray-700">Reset</button>
					</div>
				</div>

				<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<div className="rounded-lg border border-gray-200 bg-gray-950 p-2 dark:border-gray-700"><div ref={containerRef} className="mx-auto min-h-[380px] w-full overflow-auto bg-black text-white" aria-label="x86 emulator viewport" /></div>
					{!isRunning ? <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-300">Emulator is idle. Enter valid assets and press <strong>Start</strong>.</p> : null}
				</div>
			</section>

			<section className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
				<h2 className="text-lg font-semibold">Security and licensing notes</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5"><li>Only boot BIOS and OS images you have legal rights to use.</li><li>Remote images need CORS support; large images should support range requests.</li><li>copy.sh is a reference/demo site, not a backend API to scrape or blindly iframe.</li></ul>
			</section>
		</div>
	);
}
