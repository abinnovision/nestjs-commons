/**
 * Exhaustive check helper for discriminated unions.
 *
 * Use in `default` branches of `switch` statements (or in the final `else` of
 * a chain) to ensure every variant of a union is handled. The compiler will
 * fail the build if a new variant is added without updating the caller, and
 * the function throws at runtime if it is ever reached.
 *
 * @example
 * ```typescript
 * type Shape = { kind: "circle" } | { kind: "square" };
 *
 * function area(shape: Shape): number {
 *   switch (shape.kind) {
 *     case "circle": return 1;
 *     case "square": return 2;
 *     default: return assertNever(shape);
 *   }
 * }
 * ```
 *
 * @param value - The value that should have been narrowed to `never`
 * @throws Error - Always, including the offending value in the message
 */
export function assertNever(value: never): never {
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	throw new Error(`Unhandled case: ${value}`);
}
