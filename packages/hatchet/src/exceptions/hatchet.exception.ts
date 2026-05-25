/**
 * Base class for all exceptions thrown by the hatchet integration.
 *
 * Subclasses set `name` to their own class name for clean stack traces
 * and may expose typed metadata via additional readonly properties.
 */
export abstract class HatchetException extends Error {
	protected constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = new.target.name;
	}
}
