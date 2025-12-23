import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 全局模块，无需导入即可使用PrismaService
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
