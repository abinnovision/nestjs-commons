import { defineConfig } from "tsdown";
import swc from "unplugin-swc";

export default defineConfig({
	attw: { profile: "node16", level: "error" },
	publint: true,
	entry: ["src/index.ts", "src/sdk-export/index.ts"],
	unbundle: true,
	format: ["cjs", "esm"],
	clean: true,
	deps: { skipNodeModulesBundle: true },
	plugins: [swc.rolldown()],
});
