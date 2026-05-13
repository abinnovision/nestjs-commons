import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	output: "export",
	distDir: "dist",
	basePath: "/nestjs-commons",
	images: { unoptimized: true },
	trailingSlash: true,
	reactStrictMode: true,
};

export default withMDX(config);
