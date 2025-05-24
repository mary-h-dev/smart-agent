import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Reflector } from '@nestjs/core';
  
  @Injectable()
  export class ApiKeyGuard implements CanActivate {
    constructor(
      private reflector: Reflector,
      private configService: ConfigService,
    ) {}
  
    canActivate(context: ExecutionContext): boolean {
      const isPublic = this.reflector.get<boolean>(
        'isPublic',
        context.getHandler(),
      );
      
      if (isPublic) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];
      const validApiKey = this.configService.get<string>('apiKey');
  
      if (!validApiKey || !apiKey) {
        throw new UnauthorizedException('API key is required');
      }
  
      if (apiKey !== validApiKey) {
        throw new UnauthorizedException('Invalid API key');
      }
  
      return true;
    }
  }