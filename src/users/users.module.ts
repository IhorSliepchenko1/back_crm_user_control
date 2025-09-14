import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RoleModule } from 'src/role/role.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
