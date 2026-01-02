import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

// 设置全局代理
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  const proxyAgent = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(proxyAgent);
  logger.log(`Proxy enabled: ${proxyUrl}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProd = configService.get('NODE_ENV') === 'production';

  // 安全响应头
  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }));

  // CORS配置 - 生产环境限制来源
  const corsOrigin = configService.get('CORS_ORIGIN');
  app.enableCors({
    origin: isProd ? corsOrigin?.split(',') || false : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3000;
  const host = isProd ? '127.0.0.1' : '0.0.0.0'; // 生产环境绑定本地，由反向代理转发
  await app.listen(port, host);

  logger.log(
    `SmartKPI Backend running on http://${host}:${port}/api [${isProd ? 'PROD' : 'DEV'}]`,
  );
}
bootstrap();
