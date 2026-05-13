import Link from "next/link";

const packages = [
	{
		name: "@abinnovision/nestjs-configx",
		slug: "configx",
		description:
			"Type-safe configuration management for NestJS, powered by Standard Schema.",
	},
	{
		name: "@abinnovision/nestjs-exceptions",
		slug: "exceptions",
		description:
			"Entity-focused exception handling for NestJS with HTTP and GraphQL support.",
	},
	{
		name: "@abinnovision/nestjs-hatchet",
		slug: "hatchet",
		description:
			"NestJS integration for Hatchet — distributed workflow orchestration.",
	},
	{
		name: "@abinnovision/nestjs-toolkit",
		slug: "toolkit",
		description:
			"Shared utilities: remeda re-export, slug/sanitize helpers, UUID helpers.",
	},
];

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col">
			<section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pt-24 pb-12 sm:pt-32">
				<span className="text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
					@abinnovision
				</span>
				<h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
					nestjs-commons
				</h1>
				<p className="max-w-2xl text-balance text-lg text-fd-muted-foreground">
					A small family of NestJS packages — configuration,
					exceptions, workflow orchestration, and shared utilities.
					Independently versioned, type-safe, and production-tested.
				</p>
				<div className="mt-2 flex flex-wrap gap-3">
					<Link
						href="/docs"
						className="inline-flex h-10 items-center justify-center rounded-md bg-fd-foreground px-5 text-sm font-medium text-fd-background transition-opacity hover:opacity-90"
					>
						Read the docs
					</Link>
					<a
						href="https://github.com/abinnovision/nestjs-commons"
						className="inline-flex h-10 items-center justify-center rounded-md border border-fd-border px-5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
					>
						View on GitHub
					</a>
				</div>
			</section>

			<section className="mx-auto w-full max-w-5xl px-6 pb-24">
				<h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
					Packages
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{packages.map((pkg) => (
						<Link
							key={pkg.slug}
							href={`/docs/packages/${pkg.slug}`}
							className="group flex flex-col gap-2 rounded-lg border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-foreground/30 hover:bg-fd-muted"
						>
							<span className="font-mono text-sm font-medium text-fd-foreground">
								{pkg.name}
							</span>
							<span className="text-sm text-fd-muted-foreground">
								{pkg.description}
							</span>
						</Link>
					))}
				</div>
			</section>
		</main>
	);
}
