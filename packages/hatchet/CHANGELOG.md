# Changelog

## [0.3.2](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.3.1...nestjs-hatchet-v0.3.2) (2026-01-28)


### Bug Fixes

* pass task options through to TaskWorkflowDeclaration ([#89](https://github.com/abinnovision/nestjs-commons/issues/89)) ([e45d19b](https://github.com/abinnovision/nestjs-commons/commit/e45d19bb7812755f3108c99900d897eeab7e24d5))

## [0.3.1](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.3.0...nestjs-hatchet-v0.3.1) (2026-01-10)


### Bug Fixes

* detect event only by metadata ([#85](https://github.com/abinnovision/nestjs-commons/issues/85)) ([402e9d7](https://github.com/abinnovision/nestjs-commons/commit/402e9d7bb410dba261d1a78984857c39824d91be))

## [0.3.0](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.2.4...nestjs-hatchet-v0.3.0) (2026-01-10)


### Features

* add execution wrapper support for tasks and workflows ([#54](https://github.com/abinnovision/nestjs-commons/issues/54)) ([8f96d3d](https://github.com/abinnovision/nestjs-commons/commit/8f96d3deb9ad40392a9d3328990c851947abf663))
* add hatchet integration ([#44](https://github.com/abinnovision/nestjs-commons/issues/44)) ([59a2138](https://github.com/abinnovision/nestjs-commons/commit/59a2138788ea2a262ad70b3298429dd518345d1c))
* allow event definitions to be used in onEvents from @Host(...) ([#80](https://github.com/abinnovision/nestjs-commons/issues/80)) ([2408228](https://github.com/abinnovision/nestjs-commons/commit/2408228f2aeb7a70ddc9e2119b5f1c1614a807c0))
* normalize hatchet inputs depending on trigger source ([#78](https://github.com/abinnovision/nestjs-commons/issues/78)) ([3cf5485](https://github.com/abinnovision/nestjs-commons/commit/3cf5485800b3a4f64fb191d0a7335136cf24725c))
* normalize hatchet inputs depending on trigger source ([#79](https://github.com/abinnovision/nestjs-commons/issues/79)) ([e91f113](https://github.com/abinnovision/nestjs-commons/commit/e91f11341fc5fdd02e9254c9671eabf0fddf49b1))
* rename execution wrapper to interceptor and remove unused code ([#58](https://github.com/abinnovision/nestjs-commons/issues/58)) ([b9dacbd](https://github.com/abinnovision/nestjs-commons/commit/b9dacbdca8ad41312768a98ed559f4c030ca7b5a))
* scope down the public api ([#81](https://github.com/abinnovision/nestjs-commons/issues/81)) ([4924861](https://github.com/abinnovision/nestjs-commons/commit/4924861c54cfceabf567565f704c52a1b75209a1))
* support multiple interceptors ([#59](https://github.com/abinnovision/nestjs-commons/issues/59)) ([f686508](https://github.com/abinnovision/nestjs-commons/commit/f686508b6f4e61d03846173c061152e0481a2b48))
* update worker configuration structure ([#56](https://github.com/abinnovision/nestjs-commons/issues/56)) ([3de8fb4](https://github.com/abinnovision/nestjs-commons/commit/3de8fb44e9814bb2a12d1a1b9081c03945f398cb))


### Bug Fixes

* align exports in package.json ([#70](https://github.com/abinnovision/nestjs-commons/issues/70)) ([58956c5](https://github.com/abinnovision/nestjs-commons/commit/58956c5ea55394b65c6af405f4c6ac45555dc94a))
* remove dual registration of host providers ([#64](https://github.com/abinnovision/nestjs-commons/issues/64)) ([2c262f2](https://github.com/abinnovision/nestjs-commons/commit/2c262f2877a7676854324ac841ae5f58f9dbd97f))
* resolve interceptor using ModuleRef ([#67](https://github.com/abinnovision/nestjs-commons/issues/67)) ([aedb022](https://github.com/abinnovision/nestjs-commons/commit/aedb0223d4b8aa99a967420bf211c176da04a293))
* simplify ref types ([#60](https://github.com/abinnovision/nestjs-commons/issues/60)) ([79680d1](https://github.com/abinnovision/nestjs-commons/commit/79680d12c5b0aa2fc9201a574c36f743f5518c43))
* streamline context and interaction exports for public api ([#61](https://github.com/abinnovision/nestjs-commons/issues/61)) ([529deb1](https://github.com/abinnovision/nestjs-commons/commit/529deb1a30577debc40f94a23eb1ad99e2aaf2ae))

## [0.2.3](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.2.2...nestjs-hatchet-v0.2.3) (2025-12-16)


### Bug Fixes

* align exports in package.json ([#70](https://github.com/abinnovision/nestjs-commons/issues/70)) ([58956c5](https://github.com/abinnovision/nestjs-commons/commit/58956c5ea55394b65c6af405f4c6ac45555dc94a))

## [0.2.2](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.2.1...nestjs-hatchet-v0.2.2) (2025-12-15)


### Bug Fixes

* resolve interceptor using ModuleRef ([#67](https://github.com/abinnovision/nestjs-commons/issues/67)) ([aedb022](https://github.com/abinnovision/nestjs-commons/commit/aedb0223d4b8aa99a967420bf211c176da04a293))

## [0.2.1](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.2.0...nestjs-hatchet-v0.2.1) (2025-12-15)


### Bug Fixes

* remove dual registration of host providers ([#64](https://github.com/abinnovision/nestjs-commons/issues/64)) ([2c262f2](https://github.com/abinnovision/nestjs-commons/commit/2c262f2877a7676854324ac841ae5f58f9dbd97f))

## [0.2.0](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.1.0...nestjs-hatchet-v0.2.0) (2025-12-15)


### Features

* add execution wrapper support for tasks and workflows ([#54](https://github.com/abinnovision/nestjs-commons/issues/54)) ([8f96d3d](https://github.com/abinnovision/nestjs-commons/commit/8f96d3deb9ad40392a9d3328990c851947abf663))
* rename execution wrapper to interceptor and remove unused code ([#58](https://github.com/abinnovision/nestjs-commons/issues/58)) ([b9dacbd](https://github.com/abinnovision/nestjs-commons/commit/b9dacbdca8ad41312768a98ed559f4c030ca7b5a))
* support multiple interceptors ([#59](https://github.com/abinnovision/nestjs-commons/issues/59)) ([f686508](https://github.com/abinnovision/nestjs-commons/commit/f686508b6f4e61d03846173c061152e0481a2b48))
* update worker configuration structure ([#56](https://github.com/abinnovision/nestjs-commons/issues/56)) ([3de8fb4](https://github.com/abinnovision/nestjs-commons/commit/3de8fb44e9814bb2a12d1a1b9081c03945f398cb))


### Bug Fixes

* simplify ref types ([#60](https://github.com/abinnovision/nestjs-commons/issues/60)) ([79680d1](https://github.com/abinnovision/nestjs-commons/commit/79680d12c5b0aa2fc9201a574c36f743f5518c43))
* streamline context and interaction exports for public api ([#61](https://github.com/abinnovision/nestjs-commons/issues/61)) ([529deb1](https://github.com/abinnovision/nestjs-commons/commit/529deb1a30577debc40f94a23eb1ad99e2aaf2ae))

## [0.1.0](https://github.com/abinnovision/nestjs-commons/compare/nestjs-hatchet-v0.0.1...nestjs-hatchet-v0.1.0) (2025-12-14)


### Features

* add hatchet integration ([#44](https://github.com/abinnovision/nestjs-commons/issues/44)) ([59a2138](https://github.com/abinnovision/nestjs-commons/commit/59a2138788ea2a262ad70b3298429dd518345d1c))
