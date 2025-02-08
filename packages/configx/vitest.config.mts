import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "@abinnovision/nestjs-configx#unit",
		include: ["src/**/*.spec.[m,]ts"],
		environment: "node",
	},
});
