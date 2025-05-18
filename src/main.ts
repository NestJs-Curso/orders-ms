import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule);

  await app.listen(envs.port ?? 3000);

  logger.log(`Gateway runningon port ${envs.port}`);
}
bootstrap();
