import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: {
		default: "nestjs-commons",
		template: "%s · nestjs-commons",
	},
	description:
		"Common NestJS packages from AB INNOVISION — configuration, exceptions, workflow orchestration, and shared utilities.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider
					search={{
						options: {
							type: "static",
							api: "/nestjs-commons/api/search",
						},
					}}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
