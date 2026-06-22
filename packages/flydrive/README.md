# @abinnovision/nestjs-flydrive

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-flydrive?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-flydrive)

NestJS integration for [flydrive](https://flydrive.dev). Drivers for the local filesystem, AWS S3 (incl. R2, Spaces, Supabase), and Google Cloud Storage.

Disks are identified by classes, not strings. Each disk is a class produced by `defineDisk()` used both as the DI token and as the type at injection sites.

## Installation

```bash
yarn add @abinnovision/nestjs-flydrive
```

Install only the driver SDKs you actually use:

```bash
# S3 / R2 / Spaces / Supabase
yarn add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Google Cloud Storage
yarn add @google-cloud/storage
```

`flydrive` is ESM-only and requires Node.js 24 or newer.

## Quick Start

### 1. Declare a disk reference class

```typescript
import { defineDisk } from "@abinnovision/nestjs-flydrive";

export class UploadsDisk extends defineDisk() {}
export class BackupsDisk extends defineDisk() {}
```

### 2. Register the module

```typescript
import { FlydriveModule } from "@abinnovision/nestjs-flydrive";
import { FSDriver } from "flydrive/drivers/fs";
import { S3Driver } from "flydrive/drivers/s3";

@Module({
  imports: [
    FlydriveModule.forRoot({
      default: UploadsDisk,
      disks: [
        {
          ref: UploadsDisk,
          driver: () =>
            new FSDriver({
              location: new URL("./uploads", import.meta.url),
              visibility: "public",
            }),
        },
        {
          ref: BackupsDisk,
          driver: () =>
            new S3Driver({
              bucket: process.env.S3_BUCKET!,
              region: process.env.AWS_REGION!,
              visibility: "private",
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              },
            }),
        },
      ],
    }),
  ],
})
export class AppModule {}
```

The module is `@Global()`, so disk classes and `DefaultDisk` are
injectable across the application after a single import.

### 3. Inject and use

```typescript
import { Injectable } from "@nestjs/common";
import { DefaultDisk } from "@abinnovision/nestjs-flydrive";

@Injectable()
export class UploadService {
  public constructor(
    private readonly uploads: UploadsDisk,
    private readonly backups: BackupsDisk,
    private readonly defaultDisk: DefaultDisk,
  ) {}

  public async store(key: string, body: Uint8Array): Promise<void> {
    await this.uploads.put(key, body);
  }
}
```

`DefaultDisk` resolves to whichever class was passed as `default`.

## Async configuration

```typescript
FlydriveModule.forRootAsync({
  default: UploadsDisk,
  disks: [UploadsDisk, BackupsDisk],
  imports: [StorageConfigModule],
  inject: [StorageConfig],
  useFactory: (cfg: StorageConfig) => ({
    drivers: [
      {
        ref: UploadsDisk,
        driver: () =>
          new FSDriver({ location: cfg.localPath, visibility: "public" }),
      },
      {
        ref: BackupsDisk,
        driver: () =>
          new S3Driver({ bucket: cfg.bucket, region: cfg.region /* ... */ }),
      },
    ],
  }),
});
```

`disks` is supplied statically because Nest needs the provider tokens at
module-definition time, before `useFactory` runs. The refs returned by
the factory must match `disks` exactly; mismatches throw at startup.

## Lifecycle

- Driver factories run once during `onModuleInit`. A throw aborts the
  application bootstrap. No retries.
- Resolving the same ref class always returns the same `Disk` instance.
- Errors from `Disk` propagate unmodified (flydrive's own `AppError`
  subclasses).

## Testing

### Swap drivers at runtime with `FlydriveTester`

`FlydriveTester` replaces the driver behind a ref without rebuilding the
testing module. The injected `Disk` reference keeps its identity.

```typescript
import { Test } from "@nestjs/testing";
import { FlydriveTester } from "@abinnovision/nestjs-flydrive";
import { FSDriver } from "flydrive/drivers/fs";

const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

await moduleRef.init();

const tester = moduleRef.get(FlydriveTester);

tester.fake(
  UploadsDisk,
  new FSDriver({
    location: new URL("./tmp/uploads", import.meta.url),
    visibility: "public",
  }),
);

// ... assertions ...

tester.restore(UploadsDisk);
```

`fake()` also accepts a factory function for deferred construction.

### Standard provider overrides

`overrideProvider` works as usual:

```typescript
await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(UploadsDisk)
  .useValue(testDisk)
  .compile();
```

## API Reference

| Export                      | Role                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `FlydriveModule`            | Module with `forRoot` / `forRootAsync`.                                         |
| `defineDisk()`              | Factory that creates a fresh disk reference class.                              |
| `DefaultDisk`               | Token aliasing the ref class chosen as `default`.                               |
| `DiskRegistry`              | Owns the `Disk` instances. Inject for advanced introspection or scripted use.   |
| `FlydriveTester`            | Class-keyed `fake()` / `restore()` helper for tests.                            |
| `flydriveModuleConfigToken` | DI token holding the resolved configuration.                                    |
| Type re-exports             | All types from `flydrive` and `flydrive/types` (e.g. `Disk`, `DriverContract`). |

## License

Apache-2.0
