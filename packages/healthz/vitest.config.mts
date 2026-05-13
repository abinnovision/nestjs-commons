import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@abinnovision/nestjs-healthz#unit",
		include: ["src/**/*.spec.ts", "src/**/*.spec.mts"],
		environment: "node",
	},
});
