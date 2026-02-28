import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppSettingsService } from './app-settings.service';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppSettingsController {
    constructor(private readonly appSettingsService: AppSettingsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all system settings' })
    async getSettings() {
        return this.appSettingsService.getSettings();
    }

    @Post()
    @ApiOperation({ summary: 'Update system settings (sysadmin only)' })
    async updateSettings(@Req() req: any, @Body() settings: Record<string, any>) {
        if (req.user.role !== 'sysadmin') {
            throw new ForbiddenException('Only sysadmin can update system settings');
        }
        return this.appSettingsService.updateSettings(settings);
    }
}
