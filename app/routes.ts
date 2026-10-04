import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("about", "routes/about.tsx"),
	route("tools", "routes/tools.tsx"),
	route("serial-monitor", "routes/serial-monitor.tsx"),
	route("x86-emulator", "routes/x86-emulator.tsx"),
	route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
