import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string; // 文件描述（可选）
}

export class FileQueryDto {
  @IsOptional()
  @IsString()
  page?: string; // 页码

  @IsOptional()
  @IsString()
  limit?: string; // 每页数量

  @IsOptional()
  @IsString()
  status?: string; // 按状态筛选
}
