import baseConfig from "@abinnovision/eslint-config-base";
import typescriptConfig from "@abinnovision/eslint-config-typescript";
import globals from "globals";

/** @type {import("@types/eslint").Linter.FlatConfig[]} */
export default [
	...baseConfig,
	...typescriptConfig,
	{ files: ["**/*.js"], languageOptions: { globals: globals.node } },
];
