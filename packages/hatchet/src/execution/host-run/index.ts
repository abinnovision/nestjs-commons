export type { HostRunFn, HostRunOpts, HostRunReturn } from "./function-type.js";
export {
	createHostRunForContext,
	createHostRunForDurableContext,
	createHostRunForAdmin,
} from "./adapter-factory.js";
