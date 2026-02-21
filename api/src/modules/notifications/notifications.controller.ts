import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const STAFF_ROLES = ['staff', 'manager', 'sysadmin'];

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    private getWhere(req: any) {
        const isStaff = STAFF_ROLES.includes(req.user?.role);
        return isStaff ? { staffId: req.user.id } : { userId: req.user.id };
    }

    @Get()
    @ApiOperation({ summary: 'Get user/staff notifications' })
    async getUserNotifications(
        @Request() req: any,
        @Query('limit') limit?: number
    ) {
        return this.notificationsService.getUserNotifications(
            this.getWhere(req),
            limit ? parseInt(String(limit)) : 20
        );
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    async getUnreadCount(@Request() req: any) {
        const count = await this.notificationsService.getUnreadCount(this.getWhere(req));
        return { count };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.notificationsService.markAsRead(id, this.getWhere(req));
    }

    @Post('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(@Request() req: any) {
        await this.notificationsService.markAllAsRead(this.getWhere(req));
        return { success: true };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification' })
    async deleteNotification(@Param('id') id: string, @Request() req: any) {
        await this.notificationsService.deleteNotification(id, this.getWhere(req));
        return { success: true };
    }
}
