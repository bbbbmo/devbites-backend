import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/guards/auth.guard';
import { SubscriptionService } from './subscription.service';

type FirebaseUser = {
  uid: string;
  email: string;
};

@Controller('subscription')
@UseGuards(FirebaseAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async subscribe(@Req() req: Request & { user?: FirebaseUser }) {
    const user = req.user;

    const uid = user?.uid;
    const email = user?.email;

    if (!uid || !email) {
      throw new Error('Firebase 사용자 정보가 없습니다.');
    }

    return this.subscriptionService.createOrUpdateSubscription(uid, email);
  }
}
