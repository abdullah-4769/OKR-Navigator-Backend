import { Injectable } from '@nestjs/common';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  id: number;
  name: string;
  price: string;
  features: PlanFeature[];
}

@Injectable()
export class PlansService {
  private plans: Plan[] = [
    {
      id: 1,
      name: 'Free',
      price: '0€',
      features: [
        { name: 'Solo Mode level 1', included: true },
        { name: 'AI feedback per day ', included: true },
        { name: 'certified challange per day', included: true },
        { name: 'limited badges', included: true },
      ],
    },
    {
      id: 2,
      name: 'Navigator',
      price: '3.99€/month',
      features: [
        { name: 'Full Solo Mode', included: true },
        { name: 'weekly mission', included: true },
        { name: 'AI tips & debrief', included: true },
        { name: 'XP Tracking', included: true },
        { name: 'Community leaderboard', included: true },
        { name: 'bonus mode', included: true },
      
      ],
    },
    {
      id: 3,
      name: 'MasterNavigator',
      price: '9.99€/month',
      features: [
        { name: 'All Navigator + Features', included: true },
        { name: 'Official Certification', included: true },
        { name: 'Monthly Reports', included: true },
        { name: 'Monthly live Coaching', included: true },
        { name: 'Exclusive Coaching Sessions', included: true },
      ],
    },
  ];

  getAllPlans(): Plan[] {
    return this.plans;
  }

  getPlanById(id: number): Plan | undefined {
    return this.plans.find(p => p.id === id);
  }
}
