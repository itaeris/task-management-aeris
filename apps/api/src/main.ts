import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins = [process.env.APP_URL, "http://localhost:3000"]
    .map((value) => value?.trim().replace(/\/$/, ""))
    .filter((value): value is string => Boolean(value));
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  app.setGlobalPrefix("v1", { exclude: ["health"] });
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
}

void bootstrap();
