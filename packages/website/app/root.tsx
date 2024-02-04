import type { LinksFunction } from '@remix-run/cloudflare';
import { cssBundleHref } from '@remix-run/css-bundle';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import './app.css';

export const links: LinksFunction = () => [
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export default function App() {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />

				<title>Home of BEN&apos;S FACTS</title>
				<meta name="description" content="Ben's facts, home of Ben's facts" />

				<link rel="icon" href="favicon.ico" type="image/x-icon" />

				<Links />
			</head>
			<body>
				<main>
					<Outlet />
				</main>

				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
