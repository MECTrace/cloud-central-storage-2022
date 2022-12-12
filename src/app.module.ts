import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppGateway } from './app.gateway';
import { TypeOrmConfigService } from './config/database/typeorm-config.service';
import { EventModule } from './modules/event/event.module';
import { NodeModule } from './modules/node/node.module';
import { CertificateModule } from './modules/certificate/certificate.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ScheduleModule.forRoot(),
    NodeModule,
    EventModule,
    CertificateModule,
  ],
  providers: [AppGateway],
})
export class AppModule {}
