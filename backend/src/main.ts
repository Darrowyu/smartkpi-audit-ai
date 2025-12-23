import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// 设置全局代理
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  const proxyAgent = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(proxyAgent);
  console.log(`🌐 Proxy enabled: ${proxyUrl}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService to access environment variables
  const configService = app.get(ConfigService);

  // Enable CORS - 允许局域网访问
  app.enableCors({
    origin: true, // 允许所有来源（开发环境）
    credentials: true,
  });

  app.useGlobalPipes( // 全局验证管道
    new ValidationPipe({
      whitelist: true, // 剥离无装饰器的属性
      forbidNonWhitelisted: true, // 存在非白名单属性时抛出错误
      transform: true, // 自动将载荷转换为DTO实例
    }),
  );

  app.setGlobalPrefix('api'); // API前缀

  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0'); // 监听所有网络接口

  console.log(`🚀 SmartKPI Backend is running on: http://0.0.0.0:${port}/api`);
}
bootstrap();
