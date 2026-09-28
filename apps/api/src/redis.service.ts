import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

const TTL_SECONDS = 60;

@Injectable()
export class RedisService {
  private readonly log = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor() {
    const url = process.env.REDIS_URL?.trim() || "redis://127.0.0.1:6379";
    this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
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
      const raw = await this.client.get(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.log.warn(`Redis get failed for ${key}: ${error instanceof Error ? error.message : "unknown"}`);
      return null;
    }
  }

  async set(key: string, value: unknown, indexKey?: string) {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", TTL_SECONDS);
      if (indexKey) await this.client.sadd(indexKey, key);
    } catch (error) {
      this.log.warn(`Redis set failed for ${key}: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  async invalidateIndex(indexKey: string) {
    if (!this.client) return;
    try {
      const list = await this.client.smembers(indexKey);
      if (list.length) await this.client.del(...list, indexKey);
      else await this.client.del(indexKey);
    } catch (error) {
      this.log.warn(`Redis invalidate failed for ${indexKey}: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
}
