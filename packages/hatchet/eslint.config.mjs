import { base, configFiles, vitest } from "@abinnovision/eslint-config-base";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{ extends: [base, vitest] },
	{ files: ["*.{c,m,}{t,j}s"], extends: [configFiles] },
]);
