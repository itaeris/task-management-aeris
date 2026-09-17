import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "node:path";
import { CacheController } from "./cache.controller";
import { HealthController } from "./health.controller";
import { InternalGuard } from "./internal.guard";
import { RedisService } from "./redis.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), ".env"), join(__dirname, "..", ".env")],
    }),
  ],
  controllers: [HealthController, CacheController],
  providers: [RedisService, InternalGuard],
})
export class AppModule {}
