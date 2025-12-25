import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  QueryNotificationDto,
  BulkNotificationDto,
} from './dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) { }

  /** 获取当前用户的通知列表 */
  @Get()
  async findAll(@Request() req, @Query() query: QueryNotificationDto) {
    return this.notificationsService.findAll(req.user.userId, query);
  }

  /** 获取未读数量 */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  /** 标记单个为已读 */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { message: '已标记为已读' };
  }

  /** 标记全部为已读 */
  @Post('mark-all-read')
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(req.user.userId);
    return { message: '已全部标记为已读', count: result.count };
  }

  /** 删除单个通知 */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.notificationsService.remove(id, req.user.userId);
    return { message: '删除成功' };
  }

  /** 删除所有已读通知 */
  @Delete()
  async removeAllRead(@Request() req) {
    const result = await this.notificationsService.removeAllRead(req.user.userId);
    return { message: '已清除已读通知', count: result.count };
  }

  /** 批量发送通知（仅管理员） */
  @Post('send-bulk')
  async sendBulk(@Body() dto: BulkNotificationDto, @Request() req) {
    return this.notificationsService.sendBulk(dto, req.user.companyId);
  }
}
