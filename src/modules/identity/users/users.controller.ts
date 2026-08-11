import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UpdateConsumerUserDto } from './dto/update-consumer-user.dto';
import { UsersService } from './users.service';

// Alias temporal de compatibilidad mientras migramos los clientes
// desde /api/users/me hacia /api/consumer/users/me.
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.getCurrentUser(user.userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() updateUserDto: UpdateConsumerUserDto,
  ) {
    return this.usersService.updateCurrentUser(user.userId, updateUserDto);
  }
}
