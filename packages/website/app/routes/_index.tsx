import { getRandomFact } from '@bens-facts/core';
import { json, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useFetcher, useLoaderData } from '@remix-run/react';
import bensFacts from '~/images/bens-facts-logo.png';

export const loader = async ({ context }: LoaderFunctionArgs) => {
	const env = context.env as Env;
	const fact = await getRandomFact(env);

	return json({
		fact,
	});
};

export default function Index() {
	const { fact: initialFact } = useLoaderData<typeof loader>();
	const factFetcher = useFetcher<{ fact: string }>();
	const fact = factFetcher?.data != null ? factFetcher.data.fact : initialFact;

	return (
		<section>
			<div className="flex flex-col min-h-screen">
				<div className="flex-1">
					<section className="w-full pt-12 md:pt-24 lg:pt-32">
						<div className="px-4 md:px-6 space-y-10 xl:space-y-16">
							<div className="grid max-w-[1300px] gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
								<div>
									<h1 className="mb-8 lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
										Fact of the Day
									</h1>
									<div className="flex flex-col items-start space-y-4">
										<p className="max-w-[700px] text-gray-500 md:text-xl">{fact}</p>
										<factFetcher.Form method="get">
											<button type="submit" className="space-x-4 hover:text-blue-400">
												<svg
													className="h-12 w-20 move squish"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" />
													<circle cx="10" cy="13" r="8" />
													<path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" />
													<line className="wiggle" x1="18" y1="3" x2="19.1" y2="5.2" />
													<line className="wiggle" x1="22" y1="3" x2="20.9" y2="5.2" />
												</svg>
											</button>
										</factFetcher.Form>
									</div>
								</div>
								<img alt="Hero" src={bensFacts} width="300" />
							</div>
						</div>
					</section>
				</div>

				<footer className="h-20 flex items-center px-4 md:px-6 border-t">
					<p className="text-xs text-gray-500 dark:text-gray-400">
						© {new Date().getFullYear()} Ben&apos;s Facts Inc. All rights reserved.
					</p>
				</footer>
			</div>
		</section>
	);
}
