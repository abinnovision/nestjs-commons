/**
 * Reflect metadata key used by `@HealthAttestor()` to attach its
 * options to the decorated class. The explorer reads this key when
 * walking the DI container at application bootstrap.
 */
export const METADATA_KEY_HEALTH_ATTESTOR = Symbol("healthz:attestor");
