import { Injectable, BadRequestException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../lib/prisma/prisma.service';

@Injectable()
export class GoogleService {
  private client: OAuth2Client;

  constructor(private prisma: PrismaService) {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token');
      }

      return payload;
    } catch (error) {
      throw new BadRequestException('Failed to verify Google token');
    }
  }

  async loginWithGoogle(idToken: string) {
    const payload = await this.verifyGoogleToken(idToken);

if (!payload.email) {
  throw new BadRequestException('Google account has no email');
}

const user = await this.prisma.user.upsert({
  where: { email: payload.email },
  update: {
    name: payload.name || 'Google User',
    avatarPicId: payload.picture,
  },
  create: {
    name: payload.name || 'Google User',
    email: payload.email,
    password: '', // Google login users don't have a password
    avatarPicId: payload.picture,
  },
});

  await this.prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });


    return { user };
  }
}
