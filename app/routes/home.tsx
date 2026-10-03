import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "MyHub | Personal Projects & Chatbots" },
		{
			name: "description",
			content:
				"Personal hub for chatbots, software projects, and embedded IoT experiments with ESP32 and Arduino prototypes.",
		},
	];
}

export default function Home() {
	return <Welcome />;
}
