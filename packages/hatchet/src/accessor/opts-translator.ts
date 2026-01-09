import type { HostOpts } from "../decorators";
import type { CreateBaseWorkflowOpts } from "@hatchet-dev/typescript-sdk";

/**
 * Translates onEvents to SDK-compatible string array.
 */
const translateOnEvents = (
	onEvents: HostOpts["onEvents"],
): string[] | undefined => {
	// If no onEvents provided, return undefined
	if (!onEvents || onEvents.length === 0) {
		return undefined;
	}

	return onEvents.map((e) => (typeof e === "string" ? e : e.name));
};

/**
 * SDK-compatible host options.
 */
export type SdkHostOpts = Omit<CreateBaseWorkflowOpts, "on">;

/**
 * Translates enhanced HostOpts to SDK-compatible SdkHostOpts.
 */
export const translateHostOpts = (opts: HostOpts): SdkHostOpts => {
	const { onEvents, ...passthrough } = opts;
	const translatedOnEvents = translateOnEvents(onEvents);

	// Only include onEvents if it has values
	if (translatedOnEvents) {
		return { ...passthrough, onEvents: translatedOnEvents };
	}

	return passthrough;
};
