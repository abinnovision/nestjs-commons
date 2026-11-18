/**
 * Picks the first supported locale for the given candidates.
 *
 * Each candidate is matched exactly (case-insensitive), then by its base
 * language (`de-AT` -> `de`), before the next candidate is tried.
 */
export function negotiateLocale(
	candidates: readonly string[],
	supported: readonly string[],
): string | undefined {
	const byLowerCase = new Map(supported.map((it) => [it.toLowerCase(), it]));

	for (const candidate of candidates) {
		const normalized = candidate.trim().toLowerCase();
		const exact = byLowerCase.get(normalized);

		if (exact !== undefined) {
			return exact;
		}

		const base = byLowerCase.get(normalized.split("-")[0] ?? "");

		if (base !== undefined) {
			return base;
		}
	}

	return undefined;
}
