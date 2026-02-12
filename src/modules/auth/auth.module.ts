import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { FirebaseAuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [FirebaseAuthService],
  exports: [FirebaseAuthService],
})
export class AuthModule {}

