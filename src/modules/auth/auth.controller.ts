import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from './guards/auth.guard';

@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  @Get('me')
  getMe(@Req() req: Request & { user?: { uid?: string; email?: string } }) {
    return {
      uid: req.user?.uid,
      email: req.user?.email,
    };
  }
}
