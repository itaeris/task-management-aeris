import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const secret = process.env.NEST_INTERNAL_SECRET?.trim();
    if (!secret) throw new UnauthorizedException("NEST_INTERNAL_SECRET is not set.");
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const header = request.headers.authorization ?? "";
    if (header !== `Bearer ${secret}`) throw new UnauthorizedException();
    return true;
  }
}
