import { Link, type MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
	{ title: "MyHub | Tools" },
	{
		name: "description",
		content: "Browse tools and feature modules used to track chatbot, software, and IoT project workflows.",
	},
];

const tools = [
	{
		name: "Prompt Lab",
		description: "Compare prompt variants, tone presets, and response quality side-by-side.",
		status: "Ready",
	},
	{
		name: "Device Monitor",
		description: "Track sensor data streams and firmware snapshots for ESP32 and Arduino builds.",
		status: "Syncing",
	},
	{
		name: "Release Checklist",
		description: "Validate docs, demos, and test notes before sharing project milestones.",
		status: "Draft",
	},
	{
		name: "Serial Monitor",
		description: "Connect to supported serial devices from the browser to stream logs and send commands.",
		status: "New",
		href: "/serial-monitor",
	},
	{
		name: "x86 Emulator",
		description: "Configure and run v86-based browser emulation using local or hosted BIOS and disk images.",
		status: "Beta",
		href: "/x86-emulator",
	},
];

export default function Tools() {
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tools & Features</h1>
				<p className="mt-3 max-w-3xl text-base leading-7 text-gray-700 dark:text-gray-300">
					Everything is designed for lightweight iteration: prototype, review, and improve without leaving your workspace.
				</p>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Available tools">
				{tools.map((tool) => (
					<article
						key={tool.name}
						className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm motion-safe:transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
					>
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-lg font-semibold">{tool.name}</h2>
							<span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
								{tool.status}
							</span>
						</div>
						<p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">{tool.description}</p>
						{tool.href ? (
							<Link
								to={tool.href}
								className="mt-4 inline-flex rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
							>
								Open tool
							</Link>
						) : null}
					</article>
				))}
			</section>

			<section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900 sm:p-8">
				<p className="text-4xl" aria-hidden>
					🧰
				</p>
				<h2 className="mt-3 text-xl font-semibold">No active maintenance tasks</h2>
				<p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
					You are all caught up. Start a new prototype or open the dashboard streak booster to keep momentum.
				</p>
			</section>
		</div>
	);
}
