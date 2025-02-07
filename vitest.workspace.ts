import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	"{packages,example}/*/vitest.config.{m,}ts",
	"{packages,example}/*/test/{integration,e2e}/vitest.config.{m,}ts",
]);
