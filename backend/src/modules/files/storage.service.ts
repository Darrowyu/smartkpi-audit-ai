import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly avatarDir: string;

  constructor(private configService: ConfigService) {
    const configuredDir = this.configService.get('UPLOAD_DIR') || './uploads';
    this.uploadDir = path.isAbsolute(configuredDir)
      ? configuredDir
      : path.resolve(process.cwd(), configuredDir);
    this.avatarDir = path.join(this.uploadDir, 'avatars');
    this.ensureUploadDirExists();
  }

  /** 确保上传目录存在 */
  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir))
      fs.mkdirSync(this.uploadDir, { recursive: true });
    if (!fs.existsSync(this.avatarDir))
      fs.mkdirSync(this.avatarDir, { recursive: true });
  }

  /** 保存文件到本地文件系统，按公司组织：uploads/{companyId}/{fileId}.xlsx */
  async saveFile(
    companyId: string,
    fileId: string,
    buffer: Buffer,
    originalName: string,
  ): Promise<string> {
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
      this.logger.error(
        'Storage error',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  /** 从存储读取文件 */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      return await fs.promises.readFile(absolutePath);
    } catch (error) {
      this.logger.error(
        `File read error, path: ${filePath}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to read file');
    }
  }

  /** 从存储删除文件 */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
      }
    } catch (error) {
      this.logger.warn(
        'File delete error',
        error instanceof Error ? error.message : error,
      );
    }
  }

  /** 检查文件是否存在 */
  fileExists(filePath: string): boolean {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    return fs.existsSync(absolutePath);
  }

  /** 保存用户头像，覆盖旧文件：uploads/avatars/{userId}.{ext} */
  async saveAvatar(
    userId: string,
    buffer: Buffer,
    ext: string,
  ): Promise<string> {
    try {
      await this.deleteOldAvatar(userId); // 删除旧头像（任何扩展名）
      const fileName = `${userId}${ext}`;
      const filePath = path.join(this.avatarDir, fileName);
      await fs.promises.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      this.logger.error(
        'Avatar save error',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to save avatar');
    }
  }

  /** 删除用户旧头像（支持任意扩展名） */
  private async deleteOldAvatar(userId: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.avatarDir);
      const oldAvatars = files.filter((f) => f.startsWith(userId));
      for (const file of oldAvatars) {
        await fs.promises.unlink(path.join(this.avatarDir, file));
      }
    } catch (error) {
      /* 忽略删除错误 */
    }
  }
}
