import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthService } from '../auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly authService: FirebaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const authHeader = request.headers['authorization'];

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    const idToken = authHeader.split(' ')[1];
    try {
      const decodedToken = await this.authService.verifyIdToken(idToken);
      request.user = decodedToken;
      return true;
    } catch {
      throw new UnauthorizedException('토큰이 유효하지 않습니다.');
    }
  }
}
