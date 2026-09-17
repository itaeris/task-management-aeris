import { Controller, Get } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Controller("health")
export class HealthController {
  constructor(private readonly redis: RedisService) {}

  @Get()
  async check() {
    const redis = await this.redis.ping().catch(() => "error");
    return { ok: true, redis };
  }
}
