import { ValidationPipe } from '@nestjs/common';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { WEB_SOCKET_GATEWAY } from './constants';

async function bootstrap() {
  let httpsOptions: HttpsOptions;
  if (process.env.NODE_ENV !== 'DEV') {
    httpsOptions = {
      key: fs.readFileSync(`cert/${process.env.CLOUD_KEY}`),
      cert: fs.readFileSync(`cert/${process.env.CLOUD_CERT}`),
      ca: fs.readFileSync(`cert/${process.env.CA_CERT}`),
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  app.enableCors(WEB_SOCKET_GATEWAY);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('Penta Security')
    .setDescription('Penta Security Swagger API Document')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(Number(process.env.APP_PORT) || 3000);
}
void bootstrap();
