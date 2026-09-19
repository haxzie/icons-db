import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Env = CloudflareEnv;

export async function getEnv(): Promise<Env> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
