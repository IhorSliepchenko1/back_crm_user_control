import { Module } from '@nestjs/common';
import { Listeners } from './listeners.listener';

@Module({
  providers: [Listeners],
})
export class ListenersModule {}
