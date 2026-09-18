import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const origins = [process.env.APP_URL, "http://localhost:3000"]
    .map((value) => value?.trim().replace(/\/$/, ""))
    .filter((value): value is string => Boolean(value));
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  app.setGlobalPrefix("v1", { exclude: ["health"] });
  await app.listen(Number(process.env.PORT) || 4000, "0.0.0.0");
}

void bootstrap();
