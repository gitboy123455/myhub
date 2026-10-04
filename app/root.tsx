import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	NavLink,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";

const navigationItems = [
	{ to: "/", label: "Dashboard" },
	{ to: "/about", label: "About" },
	{ to: "/tools", label: "Tools" },
	{ to: "/settings", label: "Settings" },
];

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [showHint, setShowHint] = useState(false);

	useEffect(() => {
		const savedTheme = window.localStorage.getItem("myhub-theme");
		if (savedTheme === "light" || savedTheme === "dark") {
			setTheme(savedTheme);
			return;
		}

		setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		document.documentElement.style.colorScheme = theme;
		window.localStorage.setItem("myhub-theme", theme);
	}, [theme]);

	useEffect(() => {
		const onShortcut = (event: KeyboardEvent) => {
			if (event.key === "/" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setShowHint((current) => !current);
			}
		};

		window.addEventListener("keydown", onShortcut);
		return () => window.removeEventListener("keydown", onShortcut);
	}, []);

	return (
		<>
			<a
				href="#main-content"
				className="skip-link focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950"
			>
				Skip to content
			</a>
			<div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
				<header className="border-b border-gray-200/90 bg-white/90 backdrop-blur motion-safe:transition-colors dark:border-gray-800 dark:bg-gray-900/80">
					<div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
						<div className="flex items-center justify-between gap-4">
							<Link
								to="/"
								className="rounded-md text-lg font-semibold tracking-tight text-indigo-700 outline-none motion-safe:transition-colors hover:text-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
							>
								MyHub
							</Link>
							<button
								type="button"
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
								className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200 lg:hidden"
								aria-label="Toggle theme"
							>
								{theme === "dark" ? "☀️ Light" : "🌙 Dark"}
							</button>
						</div>
						<nav aria-label="Primary" className="overflow-x-auto">
							<ul className="flex min-w-max items-center gap-2 pb-1 lg:pb-0">
								{navigationItems.map((item) => (
									<li key={item.to}>
										<NavLink
											to={item.to}
											className={({ isActive }) =>
												[
													"inline-flex rounded-md px-3 py-2 text-sm font-medium outline-none motion-safe:transition focus-visible:ring-2 focus-visible:ring-indigo-500",
													isActive
														? "bg-indigo-600 text-white"
														: "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-200",
												].join(" ")
											}
										>
											{item.label}
										</NavLink>
									</li>
								))}
							</ul>
						</nav>
						<div className="hidden items-center gap-3 lg:flex">
							<button
								type="button"
								onClick={() => setShowHint((current) => !current)}
								className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
							>
								⌘/ hints
							</button>
							<button
								type="button"
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
								className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium outline-none motion-safe:transition hover:border-indigo-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
								aria-label="Toggle theme"
							>
								{theme === "dark" ? "☀️ Light" : "🌙 Dark"}
							</button>
						</div>
					</div>
					{showHint && (
						<p className="mx-auto max-w-6xl px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 sm:px-6 lg:px-8">
							✨ Quick tip: press <kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">Ctrl</kbd> +
							<kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">/</kbd> anytime to open or close hints.
						</p>
					)}
				</header>

				<main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
					<Outlet />
				</main>
			</div>
		</>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
			<h1 className="text-3xl font-semibold">{message}</h1>
			<p className="mt-4 text-gray-700 dark:text-gray-300">{details}</p>
			{stack && (
				<pre className="mt-6 w-full overflow-x-auto rounded-lg border border-gray-300 p-4 dark:border-gray-700">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
