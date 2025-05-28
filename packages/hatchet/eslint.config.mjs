import configBase from "@abinnovision/eslint-config-base";
import configTypescript from "@abinnovision/eslint-config-typescript";
import globals from "globals";

/** @type {import("@types/eslint").Linter.FlatConfig[]} */
export default [
	...configBase,
	...configTypescript,
	{ files: ["**/*.js"], languageOptions: { globals: globals.node } },
];
