import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
    this.ensureUploadDirExists();
  }

  /** 确保上传目录存在 */
  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /** 保存文件到本地文件系统，按公司组织：uploads/{companyId}/{fileId}.xlsx */
  async saveFile(companyId: string, fileId: string, buffer: Buffer, originalName: string): Promise<string> {
    try {
      const companyDir = path.join(this.uploadDir, companyId); // 创建公司专属目录
      if (!fs.existsSync(companyDir)) {
        fs.mkdirSync(companyDir, { recursive: true });
      }

      const ext = path.extname(originalName); // 提取文件扩展名
      const fileName = `${fileId}${ext}`;
      const filePath = path.join(companyDir, fileName);

      await fs.promises.writeFile(filePath, buffer); // 写入文件到磁盘

      return filePath;
    } catch (error) {
      console.error('Storage error:', error);
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  /** 从存储读取文件 */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      console.error('File read error:', error);
      throw new InternalServerErrorException('Failed to read file');
    }
  }

  /** 从存储删除文件 */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('File delete error:', error); // 不抛出错误，文件可能已被删除
    }
  }

  /** 检查文件是否存在 */
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
