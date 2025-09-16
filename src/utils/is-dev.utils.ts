import { ConfigService } from '@nestjs/config';

export function isDev(configService: ConfigService) {
  return (
    configService.getOrThrow<'development' | 'prodaction'>('NODE_ENV') ===
    'development'
  );
}
