import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { PlansService, Plan } from './plans.service'

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService,    private plansService: PlansService) {}

  async assignDefaultFreePlan(userId: string) {
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, active: true },
    });

    if (!existing) {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(startDate.getMonth() + 1);

      await this.prisma.subscription.create({
        data: { userId, planId: 1, startDate, expiryDate, active: true },
      });
    }
  }

  async addSubscription(userId: string, planId: number) {
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, active: true },
    });

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(startDate.getMonth() + 1);

    if (existing) {
      if (existing.planId === planId) {
        return this.prisma.subscription.update({
          where: { id: existing.id },
          data: { startDate, expiryDate },
        });
      }

      await this.prisma.subscription.updateMany({
        where: { userId, active: true },
        data: { active: false },
      });
    }

    return this.prisma.subscription.create({
      data: { userId, planId, startDate, expiryDate, active: true },
    });
  }

  async getUserPlan(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, active: true },
    });

    if (!subscription) return null;

    if (new Date() > subscription.expiryDate) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { active: false },
      });
      return null;
    }

    return subscription;
  }


async getUsersWithPlanSimple(page = 1) {
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  // fetch subscriptions
  const subscriptions = await this.prisma.subscription.findMany({
    where: { active: true },
    skip,
    take: pageSize + 1, // fetch 1 extra to check if more exists
    orderBy: { startDate: 'desc' },
  });

  // check if more users exist
  const hasMore = subscriptions.length > pageSize;
  if (hasMore) subscriptions.pop();

  // fetch user info separately
  const userIds = subscriptions.map(sub => sub.userId);
  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const countsRaw = await this.prisma.subscription.groupBy({
    by: ['planId'],
    where: { active: true },
    _count: { planId: true },
  });

  const counts = { Free: 0, Navigator: 0, MasterNavigator: 0 };
  countsRaw.forEach(c => {
    if (c.planId === 1) counts.Free = c._count.planId;
    if (c.planId === 2) counts.Navigator = c._count.planId;
    if (c.planId === 3) counts.MasterNavigator = c._count.planId;
  });

  return { subscriptions, users, counts, hasMore };
}



async getSubscriptionDashboard() {
  const subscriptions = await this.prisma.subscription.findMany()
  const plans = await this.plansService.getAllPlans()
  const users = await this.prisma.user.findMany()

  const planMap = new Map(plans.map(p => [p.id, p]))
  let totalRevenue = 0
  const payingUsersSet = new Set()
  const revenueByMonth: Record<string, number> = {}
  const planStats: Record<number | string, { name: string; price: number; users: number }> = {}

  subscriptions.forEach(sub => {
    const plan = planMap.get(sub.planId)
    if (!plan) return

    const price = Number(plan.price.replace(/[^\d.]/g, ''))
    totalRevenue += price
    if (price > 0) payingUsersSet.add(sub.userId)

    const y = sub.startDate.getFullYear()
    const m = String(sub.startDate.getMonth() + 1).padStart(2, "0")
    const monthKey = `${y}-${m}`

    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + price

    if (!planStats[sub.planId]) {
      planStats[sub.planId] = { name: plan.name, price, users: 0 }
    }
    planStats[sub.planId].users += 1
  })

  const subscribedUserIds = new Set(subscriptions.map(s => s.userId))
  users.forEach(user => {
    if (!subscribedUserIds.has(user.id)) {
      if (!planStats['free']) {
        planStats['free'] = { name: 'Free', price: 0, users: 0 }
      }
      planStats['free'].users += 1
    }
  })

  const planDistribution = Object.values(planStats).reduce((acc, plan) => {
    if (plan.name === 'Free') {
      const existing = acc.find(p => p.name === 'Free')
      if (existing) {
        existing.users += plan.users
        return acc
      }
    }
    acc.push(plan)
    return acc
  }, [] as { name: string; price: number; users: number }[])

  const activeSubscriptions = planDistribution.reduce((sum, plan) => sum + plan.users, 0)
  const payingUsers = payingUsersSet.size
  const avgRevenuePerUser = payingUsers === 0 ? 0 : totalRevenue / payingUsers

  const revenueTrend: { month: string; revenue: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const monthKey = `${y}-${m}`
    revenueTrend.push({ month: monthKey, revenue: revenueByMonth[monthKey] || 0 })
  }

  return {
    totalRevenue,
    activeSubscriptions,
    payingUsers,
    avgRevenuePerUser,
    revenueTrend,
    planDistribution
  }
}








}
