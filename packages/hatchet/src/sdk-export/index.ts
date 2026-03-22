/**
 * Re-exports the patched @hatchet-dev/typescript-sdk/v1 entrypoint.
 *
 * This allows consumers to import SDK types and classes from @abinnovision/nestjs-hatchet/sdk
 * without depending on the hatchet SDK directly, ensuring they use the patched version
 * that properly exports the v1 subdirectory.
 */
export * from "@hatchet-dev/typescript-sdk/v1";
