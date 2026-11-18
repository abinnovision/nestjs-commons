import type { MessageValue } from "../i18n.registry.js";

/*
 * Type-level extraction of ICU MessageFormat arguments.
 *
 * Parses `{name}`, `{name, type, style}` and `{name, plural|select, ...}`
 * with nested branches. Apostrophe escaping is not parsed: messages with
 * quoted braces, and any message that fails to parse, fall back to loose
 * params, so the parser never reports a false error.
 */

type LooseParams = Record<string, MessageValue>;

type Whitespace = " " | "\n" | "\t" | "\r";

type TrimStart<S extends string> = S extends `${Whitespace}${infer R}`
	? TrimStart<R>
	: S;

type TrimEnd<S extends string> = S extends `${infer R}${Whitespace}`
	? TrimEnd<R>
	: S;

type Trim<S extends string> = TrimEnd<TrimStart<S>>;

type RemoveEscapedQuotes<S extends string> = S extends `${infer A}''${infer B}`
	? RemoveEscapedQuotes<`${A}${B}`>
	: S;

type HasQuotedSyntax<S extends string> = S extends
	| `${string}'{${string}`
	| `${string}'}${string}`
	| `${string}'#${string}`
	? true
	: false;

/** Marks an argument without a type, so a typed use of the same name wins. */
interface Untyped {
	readonly untyped: unique symbol;
}

type ArgType<F extends string> = F extends "number" | "plural" | "selectordinal"
	? number
	: F extends "date" | "time"
		? Date | number
		: F extends "select"
			? string
			: MessageValue;

/** Arguments are collected as a union of `[name, type]` entries. */
type Arg<N extends string, T> = [Trim<N>, T];

type FirstSegment<F extends string> = Trim<
	F extends `${infer A},${string}` ? A : F
>;

/** Parses text until the end or a closing brace: `[params, rest, closed]`. */
type ParseBody<S extends string, Acc> = S extends `${infer Pre}{${infer Rest}`
	? Pre extends `${string}}${string}`
		? Close<S, Acc>
		: ParseArg<Rest> extends [infer P, infer After extends string]
			? ParseBody<After, Acc | P>
			: false
	: Close<S, Acc>;

type Close<S extends string, Acc> = S extends `${string}}${infer After}`
	? [Acc, After, true]
	: [Acc, "", false];

/** Parses an argument after its opening brace: `[params, rest]`. */
type ParseArg<S extends string> = S extends `${infer Head}}${infer After}`
	? Head extends `${string}{${string}`
		? ParseBranchedArg<S>
		: Head extends `${infer N},${infer F}`
			? [Arg<N, ArgType<FirstSegment<F>>>, After]
			: [Arg<Head, Untyped>, After]
	: false;

type ParseBranchedArg<S extends string> =
	S extends `${infer N},${infer F},${infer Branches}`
		? `${N}${F}` extends `${string}{${string}`
			? false
			: ParseBranches<Branches, Arg<N, ArgType<Trim<F>>>>
		: false;

type ParseBranches<S extends string, Acc> =
	TrimStart<S> extends `}${infer After}`
		? [Acc, After]
		: S extends `${infer Selector}{${infer Body}`
			? Selector extends `${string}}${string}`
				? false
				: ParseBody<Body, never> extends [
							infer P,
							infer After extends string,
							true,
					  ]
					? ParseBranches<After, Acc | P>
					: false
			: false;

type MergeTypes<T> = [Exclude<T, Untyped>] extends [never]
	? MessageValue
	: Exclude<T, Untyped>;

type ToParams<E extends [string, unknown]> = {
	[K in E[0]]: MergeTypes<Extract<E, [K, unknown]>[1]>;
};

type ParseMessage<S extends string> =
	ParseBody<S, never> extends [infer E extends [string, unknown], "", false]
		? ToParams<E>
		: LooseParams;

/**
 * The parameters of an ICU message. Falls back to
 * `Record<string, MessageValue>` for non-literal or unparsable messages.
 */
export type IcuParams<S extends string> = string extends S
	? LooseParams
	: HasQuotedSyntax<RemoveEscapedQuotes<S>> extends true
		? LooseParams
		: ParseMessage<RemoveEscapedQuotes<S>>;
