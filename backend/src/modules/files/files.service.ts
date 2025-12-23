import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';
import { FileProcessStatus } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class FilesService {
  private readonly allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /** 上传并处理Excel文件 */
  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    userId: string,
    description?: string,
  ) {
    this.validateFile(file); // 验证文件

    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 解码中文文件名(Multer使用Latin1编码)

    const fileId = crypto.randomUUID(); // 生成文件ID

    const storagePath = await this.storageService.saveFile( // 保存文件到存储
      companyId,
      fileId,
      file.buffer,
      originalName,
    );

    let parsedData: string | null = null; // 解析Excel获取行数和基本数据
    let rowCount: number | null = null;
    let status: FileProcessStatus = FileProcessStatus.PENDING;
    let errorMessage: string | null = null;

    try {
      const parseResult = this.parseExcel(file.buffer);
      parsedData = parseResult.csvData;
      rowCount = parseResult.rowCount;
      status = FileProcessStatus.COMPLETED;
    } catch (error) {
      status = FileProcessStatus.FAILED;
      errorMessage = error instanceof Error ? error.message : 'Failed to parse Excel file';
    }

    const uploadedFile = await this.prisma.uploadedFile.create({
      data: {
        id: fileId,
        fileName: `${fileId}${this.getFileExtension(originalName)}`,
        originalName: originalName,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath,
        status,
        errorMessage,
        parsedData: parsedData ? { csv: parsedData } : undefined,
        rowCount,
        companyId,
        uploadedById: userId,
      },
    });

    return uploadedFile;
  }

  /** 获取文件列表（分页，租户隔离） */
  async getFiles(companyId: string, page = 1, limit = 10, status?: FileProcessStatus) {
    const skip = (page - 1) * limit;

    const where = {
      companyId, // 租户隔离
      ...(status && { status }),
    };

    const [files, total] = await Promise.all([
      this.prisma.uploadedFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          fileSize: true,
          status: true,
          rowCount: true,
          createdAt: true,
          uploadedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.uploadedFile.count({ where }),
    ]);

    return {
      data: files,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** 按ID获取单个文件（租户隔离） */
  async getFileById(fileId: string, companyId: string) {
    const file = await this.prisma.uploadedFile.findFirst({
      where: { id: fileId, companyId }, // 租户隔离
      include: {
        uploadedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        kpiAnalyses: {
          select: { id: true, period: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /** 获取文件内容（用于下载） */
  async getFileContent(fileId: string, companyId: string): Promise<{ buffer: Buffer; file: any }> {
    const file = await this.getFileById(fileId, companyId);
    const buffer = await this.storageService.readFile(file.storagePath);
    return { buffer, file };
  }

  /** 删除文件（租户隔离） */
  async deleteFile(fileId: string, companyId: string) {
    const file = await this.prisma.uploadedFile.findFirst({
      where: { id: fileId, companyId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.storageService.deleteFile(file.storagePath); // 从存储删除

    await this.prisma.uploadedFile.delete({ // 从数据库删除（级联删除相关分析）
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  /** 验证上传的文件 */
  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }
  }

  /** 解析Excel文件为CSV格式 */
  private parseExcel(buffer: Buffer): { csvData: string; rowCount: number } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const csvData = XLSX.utils.sheet_to_csv(worksheet); // 转换为CSV
    
    const rows = csvData.split('\n').filter(row => row.trim()); // 计算行数（不含表头）
    const rowCount = Math.max(0, rows.length - 1);

    return { csvData, rowCount };
  }

  /** 从文件名获取扩展名 */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }
}
