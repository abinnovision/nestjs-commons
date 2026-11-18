import { parse, TYPE } from "@formatjs/icu-messageformat-parser";
import { IntlMessageFormat } from "intl-messageformat";

import type { MessageValue } from "../i18n.registry.js";
import type { MessageFormatElement } from "@formatjs/icu-messageformat-parser";

/**
 * A compiled ICU message.
 */
export interface CompiledMessage {
	format: (params?: Record<string, MessageValue>) => string;
}

/**
 * Compiles an ICU message. Throws on syntax errors.
 */
export function compileMessage(
	message: string,
	locale: string,
): CompiledMessage {
	const formatter = new IntlMessageFormat(message, locale, undefined, {
		ignoreTag: true,
	});

	return {
		format: (params) => String(formatter.format(params)),
	};
}

/**
 * Returns the argument names of an ICU message. Throws on syntax errors.
 */
export function messageArguments(message: string): Set<string> {
	const names = new Set<string>();
	const visit = (elements: MessageFormatElement[]): void => {
		for (const element of elements) {
			if (element.type === TYPE.literal || element.type === TYPE.pound) {
				continue;
			}

			if (element.type === TYPE.tag) {
				visit(element.children);
				continue;
			}

			names.add(element.value);

			if (element.type === TYPE.select || element.type === TYPE.plural) {
				for (const option of Object.values(element.options)) {
					visit(option.value);
				}
			}
		}
	};

	visit(parse(message, { ignoreTag: true }));

	return names;
}
