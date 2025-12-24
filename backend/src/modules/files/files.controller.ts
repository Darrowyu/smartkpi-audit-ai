import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadFileDto, FileQueryDto } from './dto/upload-file.dto';
import { FileProcessStatus } from '@prisma/client';

@Controller('files')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload') // POST /api/files/upload - 上传Excel文件
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.filesService.uploadFile(
      file,
      companyId,
      userId,
      uploadDto.description,
    );
  }

  @Get() // GET /api/files - 获取文件列表（分页）
  async getFiles(
    @Query() query: FileQueryDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const status = query.status as FileProcessStatus | undefined;

    return this.filesService.getFiles(companyId, page, limit, status);
  }

  @Get(':id') // GET /api/files/:id - 获取单个文件详情
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.filesService.getFileById(id, companyId);
  }

  @Get(':id/download') // GET /api/files/:id/download - 下载文件
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const { buffer, file } = await this.filesService.getFileContent(
      id,
      companyId,
    );

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Delete(':id') // DELETE /api/files/:id - 删除文件
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.filesService.deleteFile(id, companyId);
  }
}
