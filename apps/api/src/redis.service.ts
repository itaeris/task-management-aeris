import { Injectable, Logger } from "@nestjs/common";
import { Redis } from "@upstash/redis";

const TTL_SECONDS = 60;

@Injectable()
export class RedisService {
  private readonly log = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    this.client = url && token ? new Redis({ url, token }) : null;
    if (!this.client) this.log.warn("Upstash Redis is not configured. Cache is disabled.");
  }

  enabled() {
    return Boolean(this.client);
  }

  async ping() {
    if (!this.client) return "disabled";
    return this.client.ping();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      return (await this.client.get<T>(key)) ?? null;
    } catch (error) {
      this.log.warn(`Redis get failed for ${key}: ${error instanceof Error ? error.message : "unknown"}`);
      return null;
    }
  }

  async set(key: string, value: unknown, indexKey?: string) {
    if (!this.client) return;
    try {
      await this.client.set(key, value, { ex: TTL_SECONDS });
      if (indexKey) await this.client.sadd(indexKey, key);
    } catch (error) {
      this.log.warn(`Redis set failed for ${key}: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  async invalidateIndex(indexKey: string) {
    if (!this.client) return;
    try {
      const keys = (await this.client.smembers<string[]>(indexKey)) ?? [];
      const list = Array.isArray(keys) ? keys.filter(Boolean) : [];
      if (list.length) await this.client.del(...list, indexKey);
      else await this.client.del(indexKey);
    } catch (error) {
      this.log.warn(`Redis invalidate failed for ${indexKey}: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
}
