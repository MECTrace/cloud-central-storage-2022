import { ValidationPipe } from '@nestjs/common';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module';
import {
  CLOUD_CERT,
  CLOUD_KEY,
  ROOT_CA,
  WEB_SOCKET_GATEWAY,
} from './constants';

const httpCert = () => {
  if (
    fs.existsSync(CLOUD_KEY) &&
    fs.existsSync(CLOUD_CERT) &&
    fs.existsSync(ROOT_CA)
  ) {
    return {
      key: fs.readFileSync(CLOUD_KEY),
      cert: fs.readFileSync(CLOUD_CERT),
      ca: fs.readFileSync(ROOT_CA),
    };
  }
  return {
    key: undefined,
    cert: undefined,
    ca: undefined,
  };
};

async function bootstrap() {
  let httpsOptions: { key: Buffer; cert: Buffer; ca: Buffer };
  const { key, cert, ca } = httpCert();
  if (!!key && !!cert && !!ca) {
    httpsOptions = {
      key,
      cert,
      ca,
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  if (fs.existsSync(ROOT_CA)) {
    process.env.NODE_EXTRA_CA_CERTS = fs.readFileSync(ROOT_CA).toString();
  }

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
