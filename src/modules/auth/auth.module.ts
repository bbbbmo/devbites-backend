import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { FirebaseAuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [FirebaseAuthService, FirebaseAuthGuard],
  exports: [FirebaseAuthService, FirebaseAuthGuard],
})
export class AuthModule {}

