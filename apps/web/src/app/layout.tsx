import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "TableBook - Restaurant Reservations",
	description: "Discover and book tables at the best restaurants in your area",
	generator: "v0.app",
	icons: {
		icon: [
			{
				url: "/icon-light-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/icon-dark-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/icon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-icon.png",
	},
};

export const viewport: Viewport = {
	colorScheme: "light",
	themeColor: "#f8f5f1",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="bg-background">
			<body className="antialiased">
				<Providers>
					{children}
					{process.env.NODE_ENV === "production" && <Analytics />}
				</Providers>
			</body>
		</html>
	);
}
