import { Body, Controller, Delete, Get, NotFoundException, Param, Put, UseGuards } from "@nestjs/common";
import { InternalGuard } from "./internal.guard";
import { RedisService } from "./redis.service";

type CacheBody = { data: unknown };

@Controller()
@UseGuards(InternalGuard)
export class CacheController {
  constructor(private readonly redis: RedisService) {}

  @Get("projects/:projectId/workspace/:userId")
  getWorkspace(@Param("projectId") projectId: string, @Param("userId") userId: string) {
    return this.read(`ws:${projectId}:${userId}`);
  }

  @Put("projects/:projectId/workspace/:userId")
  putWorkspace(
    @Param("projectId") projectId: string,
    @Param("userId") userId: string,
    @Body() body: CacheBody,
  ) {
    return this.write(`ws:${projectId}:${userId}`, body.data, `idx:ws:${projectId}`);
  }

  @Get("projects/:projectId/shell/:userId")
  getShell(@Param("projectId") projectId: string, @Param("userId") userId: string) {
    return this.read(`shell:${projectId}:${userId}`);
  }

  @Put("projects/:projectId/shell/:userId")
  putShell(
    @Param("projectId") projectId: string,
    @Param("userId") userId: string,
    @Body() body: CacheBody,
  ) {
    return this.write(`shell:${projectId}:${userId}`, body.data, `idx:shell:${projectId}`);
  }

  @Get("users/:userId/switcher")
  getSwitcher(@Param("userId") userId: string) {
    return this.read(`switcher:${userId}`);
  }

  @Put("users/:userId/switcher")
  putSwitcher(@Param("userId") userId: string, @Body() body: CacheBody) {
    return this.write(`switcher:${userId}`, body.data, "idx:switcher");
  }

  @Get("users/:userId/home")
  getHome(@Param("userId") userId: string) {
    return this.read(`home:${userId}`);
  }

  @Put("users/:userId/home")
  putHome(@Param("userId") userId: string, @Body() body: CacheBody) {
    return this.write(`home:${userId}`, body.data, "idx:home");
  }

  @Delete("projects/:projectId")
  async invalidateProject(@Param("projectId") projectId: string) {
    await Promise.all([
      this.redis.invalidateIndex(`idx:ws:${projectId}`),
      this.redis.invalidateIndex(`idx:shell:${projectId}`),
      this.redis.invalidateIndex("idx:home"),
      this.redis.invalidateIndex("idx:switcher"),
    ]);
    return { ok: true };
  }

  @Delete("home")
  async invalidateHome() {
    await Promise.all([this.redis.invalidateIndex("idx:home"), this.redis.invalidateIndex("idx:switcher")]);
    return { ok: true };
  }

  private async read(key: string) {
    const data = await this.redis.get(key);
    if (data === null) throw new NotFoundException();
    return { data };
  }

  private async write(key: string, data: unknown, indexKey: string) {
    await this.redis.set(key, data, indexKey);
    return { ok: true };
  }
}
