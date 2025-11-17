import { Controller, Post, Body } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('auth/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post('login')
  async login(@Body('idToken') idToken: string) {
    return await this.googleService.loginWithGoogle(idToken);
  }
}
