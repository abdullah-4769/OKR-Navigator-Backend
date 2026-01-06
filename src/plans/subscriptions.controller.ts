import { Controller, Get, Post,Query, Body, Param } from '@nestjs/common';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  @Post()
  async subscribe(@Body() body: { userId: string; planId: number }) {
    const plan = this.plansService.getPlanById(body.planId);
    if (!plan) {
      return { message: 'Plan not found' };
    }

    const subscription = await this.subscriptionsService.addSubscription(
      body.userId,
      body.planId
    );

    return {
      message: 'Subscription created',
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: plan.features,
      },
    };
  }

  @Get(':userId/features')
  async getUserFeatures(@Param('userId') userId: string) {
    await this.subscriptionsService.assignDefaultFreePlan(userId);

    const subscription = await this.subscriptionsService.getUserPlan(userId);
    if (!subscription) {
      return { message: 'No active subscription or subscription expired.' };
    }

    const plan = this.plansService.getPlanById(subscription.planId);

    if (!plan) {
      return { message: 'Plan not found' };
    }

    return {
      plan: plan.name,
      features: plan.features,
      message:
        subscription.planId === 1
          ? 'Free plan assigned by default for 1 month'
          : 'Active subscription',
    };
  }

@Get('all-users')
async getAllUsers(@Query('page') pageStr?: string) {
  const page = pageStr ? Number(pageStr) : 1;

  const data = await this.subscriptionsService.getUsersWithPlanSimple(page);

  // map subscriptions to include user info
  const usersWithPlan = data.subscriptions.map(sub => {
    const user = data.users.find(u => u.id === sub.userId);
    const plan = this.plansService.getPlanById(sub.planId);

    return {
      userId: sub.userId,
      name: user?.name || 'Unknown',
      email: user?.email || 'Unknown',
      planName: plan?.name || 'Unknown',
      startDate: sub.startDate,
      expiryDate: sub.expiryDate,
      active: sub.active,
    };
  });

  return {
    counts: data.counts,
    users: usersWithPlan,
    more: data.hasMore,
  };
}




}
