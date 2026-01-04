import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomSettingsService } from './room-settings.service';

@Controller('room-settings')
@UseGuards(JwtAuthGuard)
export class RoomSettingsController {
    constructor(private readonly settingsService: RoomSettingsService) { }

    // --- TYPES ---
    @Get('types')
    getTypes(@Request() req: any) {
        return this.settingsService.getTypes(req.user.organizationId);
    }

    @Post('types')
    createType(@Request() req: any, @Body() body: { name: string, description?: string }) {
        return this.settingsService.createType(req.user.organizationId, body);
    }

    @Put('types/:id')
    updateType(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string, description?: string }) {
        return this.settingsService.updateType(parseInt(id), body);
    }

    @Delete('types/:id')
    deleteType(@Request() req: any, @Param('id') id: string) {
        return this.settingsService.deleteType(parseInt(id));
    }

    // --- FEATURES ---
    @Get('features')
    getFeatures(@Request() req: any) {
        return this.settingsService.getFeatures(req.user.organizationId);
    }

    @Post('features')
    createFeature(@Request() req: any, @Body() body: { name: string, icon?: string }) {
        return this.settingsService.createFeature(req.user.organizationId, body);
    }

    @Put('features/:id')
    updateFeature(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string, icon?: string }) {
        return this.settingsService.updateFeature(parseInt(id), body);
    }

    @Delete('features/:id')
    deleteFeature(@Request() req: any, @Param('id') id: string) {
        return this.settingsService.deleteFeature(parseInt(id));
    }
}
