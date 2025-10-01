import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadsModule } from 'src/uploads/uploads.module';
import { TokenModule } from 'src/token/token.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    UploadsModule,

    forwardRef(() => AuthModule),
    forwardRef(() => TokenModule),
  ],
})
export class UsersModule {}
