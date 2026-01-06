import { Controller, Get, Delete, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers() {
    const users = await this.userService.findAll();
    return {
      success: true,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.userService.deleteUser(id);
    return {
      success: true,
      message: `User '${user.name}' deleted successfully`,
      data: { id: user.id, name: user.name, email: user.email },
    };
  }

  @Patch('block-toggle/:id')
  async toggleBlock(@Param('id') id: string) {
    const user = await this.userService.toggleBlock(id);
    return {
      success: true,
      message: user.isBlocked
        ? `User '${user.name}' blocked successfully`
        : `User '${user.name}' unblocked successfully`,
      data: { id: user.id, name: user.name, isBlocked: user.isBlocked },
    };
  }


   @Get(':id/profile')
  async getUserProfileWithStats(@Param('id') userId: string) {
    const data = await this.userService.getUserProfileWithStats(userId)
    return {
      success: true,
      message: 'User profile fetched successfully',
      data
    }
  }


  

  @Get('ai-performance/weekly')
  async getWeeklyAiPerformance() {
    return this.userService.getWeeklyAiPerformance()
  }



   @Get('weekly-report')
  async getWeeklyReport() {
    const report = await this.userService.getWeeklyUserReport();
    return {
      success: true,
      message: 'Weekly user report fetched successfully',
      data: report,
    }
  }
}
