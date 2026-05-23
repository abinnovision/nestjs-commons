import { defineDisk } from "./disk-ref.js";

/**
 * Marker token resolving to whichever disk is configured as the module's
 * `default`.
 *
 * Inject this when you want the default disk without naming a specific ref
 * class:
 *
 * ```ts
 * @Injectable()
 * export class UploadService {
 *   constructor(private readonly disk: DefaultDisk) {}
 * }
 * ```
 *
 * The module aliases this token to the user's chosen `default` ref via a
 * `useExisting` provider, so `DefaultDisk` and the chosen ref class always
 * resolve to the same `Disk` instance.
 *
 * Do not declare your own class named `DefaultDisk` in consumer code:
 * shadowing this export silently breaks the alias.
 */
export abstract class DefaultDisk extends defineDisk() {}
