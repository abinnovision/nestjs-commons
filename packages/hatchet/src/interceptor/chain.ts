type Layer<C extends { readonly options: unknown }> = (
	ctx: C,
	next: (options?: C["options"]) => Promise<unknown>,
) => Promise<unknown>;

/**
 * Runs the layers around the terminal. The first layer is the outermost.
 * Each layer sees the options passed by the outer layer; `next(options)` replaces
 * them for the inner layers and the terminal, `next()` keeps them.
 */
export function chainWithOptions<C extends { readonly options: unknown }>(
	ctx: C,
	layers: Layer<C>[],
	terminal: (options: C["options"]) => Promise<unknown>,
): Promise<unknown> {
	const dispatch = (index: number, current: C["options"]): Promise<unknown> => {
		const layer = layers[index];
		if (layer === undefined) {
			return terminal(current);
		}

		return layer({ ...ctx, options: current }, (options) =>
			dispatch(index + 1, options ?? current),
		);
	};

	return dispatch(0, ctx.options);
}
