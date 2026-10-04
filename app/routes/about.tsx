import { type MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
	{ title: "MyHub | About" },
	{
		name: "description",
		content: "Learn about MyHub, its mission, and how it supports chatbot and IoT project workflows.",
	},
];

const values = [
	{
		title: "Prototype quickly",
		description: "Capture fast iterations for chatbot prompts, firmware experiments, and concept validation.",
	},
	{
		title: "Document learnings",
		description: "Keep track of what worked, what failed, and what should be tested next.",
	},
	{
		title: "Ship practical ideas",
		description: "Turn experiments into useful automations and connected tools for everyday workflows.",
	},
];

export default function About() {
	return (
		<section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
			<header className="space-y-3">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About MyHub</h1>
				<p className="max-w-3xl text-base leading-7 text-gray-700 dark:text-gray-300">
					MyHub is a focused workspace for personal projects blending conversational AI with embedded systems. It helps maintain momentum from idea to working prototype.
				</p>
			</header>
			<div className="grid gap-4 md:grid-cols-3">
				{values.map((value) => (
					<article key={value.title} className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950/70">
						<h2 className="text-lg font-semibold">{value.title}</h2>
						<p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{value.description}</p>
					</article>
				))}
			</div>
		</section>
	);
}
