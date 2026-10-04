import { Link, type MetaFunction } from "react-router";
import { useMemo, useState } from "react";

export const meta: MetaFunction = () => [
	{ title: "MyHub | Dashboard" },
	{
		name: "description",
		content:
			"Dashboard for personal chatbots, software projects, and embedded IoT experiments with ESP32 and Arduino prototypes.",
	},
];

const updates = [
	{ label: "Chatbot prompts tuned", value: "12" },
	{ label: "IoT prototypes built", value: "8" },
	{ label: "Active experiments", value: "3" },
];

const spotlight = [
	"Voice-enabled ESP32 assistant",
	"Arduino greenhouse monitor",
	"Local-first chatbot memory sandbox",
];

export default function Home() {
	const [streak, setStreak] = useState(4);
	const completion = useMemo(() => Math.min(100, 35 + streak * 10), [streak]);

	return (
		<div className="space-y-8">
			<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
					Personal Project Hub
				</p>
				<h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Build, test, and track your ideas in one place.</h1>
				<p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 dark:text-gray-300">
					Welcome back. MyHub keeps your chatbot experiments and embedded prototypes organized so you can iterate quickly without losing momentum.
				</p>
				<div className="mt-6 flex flex-wrap gap-3">
					<Link
						to="/tools"
						className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white outline-none motion-safe:transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
					>
						Open tools
					</Link>
					<Link
						to="/about"
						className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:text-gray-100 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
					>
						Learn more
					</Link>
				</div>
			</section>

			<section aria-label="Workspace metrics" className="grid gap-4 sm:grid-cols-3">
				{updates.map((metric) => (
					<article
						key={metric.label}
						className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
					>
						<p className="text-sm text-gray-600 dark:text-gray-300">{metric.label}</p>
						<p className="mt-3 text-3xl font-semibold text-indigo-600 dark:text-indigo-300">{metric.value}</p>
					</article>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<h2 className="text-xl font-semibold">Project spotlight</h2>
					<ul className="mt-4 space-y-3 text-gray-700 dark:text-gray-300">
						{spotlight.map((item) => (
							<li key={item} className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
								{item}
							</li>
						))}
					</ul>
				</article>
				<aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<h2 className="text-xl font-semibold">Streak booster</h2>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Keep a daily build streak to unlock new badges.</p>
					<div className="mt-4 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							className="h-full rounded-full bg-indigo-500 motion-safe:transition-all"
							style={{ width: `${completion}%` }}
							aria-hidden
						/>
					</div>
					<p className="mt-3 text-sm text-gray-700 dark:text-gray-200">Current streak: {streak} days</p>
					<button
						type="button"
						onClick={() => setStreak((current) => current + 1)}
						className="mt-4 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
					>
						+1 focus day
					</button>
				</aside>
			</section>
		</div>
	);
}
