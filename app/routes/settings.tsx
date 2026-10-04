import { type MetaFunction } from "react-router";
import { useState } from "react";

export const meta: MetaFunction = () => [
	{ title: "MyHub | Settings" },
	{
		name: "description",
		content: "Adjust profile and workflow preferences for your MyHub workspace.",
	},
];

export default function Settings() {
	const [emailUpdates, setEmailUpdates] = useState(true);
	const [publicProfile, setPublicProfile] = useState(false);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
				<p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
					Customize your workspace preferences. Theme controls are available in the header for quick switching.
				</p>
				<form className="mt-6 space-y-4" aria-label="Profile preferences">
					<label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
						<span>
							<span className="block font-medium">Email project summaries</span>
							<span className="text-sm text-gray-600 dark:text-gray-300">Receive a weekly recap of project progress.</span>
						</span>
						<input
							type="checkbox"
							checked={emailUpdates}
							onChange={(event) => setEmailUpdates(event.target.checked)}
							className="h-4 w-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
						/>
					</label>
					<label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
						<span>
							<span className="block font-medium">Public profile highlights</span>
							<span className="text-sm text-gray-600 dark:text-gray-300">Share selected milestones with collaborators.</span>
						</span>
						<input
							type="checkbox"
							checked={publicProfile}
							onChange={(event) => setPublicProfile(event.target.checked)}
							className="h-4 w-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
						/>
					</label>
				</form>
			</section>

			<aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
				<h2 className="text-2xl font-semibold">Help</h2>
				<ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
					<li className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
						<strong>Keyboard shortcut:</strong> Press Ctrl + / to toggle quick hints.
					</li>
					<li className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
						<strong>Navigation:</strong> Use the top menu to move between dashboard, tools, and profile settings.
					</li>
					<li className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
						<strong>Need help?</strong> Capture an issue note in your project log before switching tasks.
					</li>
				</ul>
			</aside>
		</div>
	);
}
