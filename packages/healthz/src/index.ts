/**
 * @abinnovision/nestjs-healthz
 *
 * Self-mounting health check module for NestJS with cross-module
 * attestor discovery, per-attestor caching, and Kubernetes-style
 * `/livez` and `/readyz` endpoints.
 */

export * from "./health-attestor.js";
export { type HealthzModuleConfig } from "./healthz.module-config.js";
export { HealthzModule } from "./healthz.module.js";
export type { HealthStatus } from "./interfaces/health-status.js";
