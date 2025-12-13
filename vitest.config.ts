import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			"{packages,example}/*/vitest.config.{m,}ts",
			"{packages,example}/*/test/{integration,e2e}/vitest.config.{m,}ts",
		],
		coverage: {
			provider: "v8",
			include: ["packages/*/src/**/*.{ts,tsx}"],
			reporter: [["lcovonly", { projectRoot: "./" }], "text"],
		},
	},
});
