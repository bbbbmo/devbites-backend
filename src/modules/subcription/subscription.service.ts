import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async createOrUpdateSubscription(
    uid: string,
    email: string,
  ): Promise<Subscription> {
    let sub = await this.subscriptionRepository.findOne({ where: { uid } });

    if (!sub) {
      sub = this.subscriptionRepository.create({ uid, email });
    } else {
      sub.email = email;
    }

    return this.subscriptionRepository.save(sub);
  }
}
