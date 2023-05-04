import { Module } from '@nestjs/common';
import { GatewayServer } from './gateway-server';
@Module({
  providers: [GatewayServer],
  exports: [GatewayServer],
})
export class GatewayModule {}
