import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "./cloudflare-types";

export function getCloudflareEnv(): CloudflareEnv {
  const { env } = getCloudflareContext();
  return env as unknown as CloudflareEnv;
}

export function requireCloudflareEnv<K extends keyof CloudflareEnv>(key: K): NonNullable<CloudflareEnv[K]> {
  const value = getCloudflareEnv()[key];
  if (!value) {
    throw new Error(`Cloudflare binding/env ${String(key)} belum dikonfigurasi`);
  }
  return value as NonNullable<CloudflareEnv[K]>;
}
