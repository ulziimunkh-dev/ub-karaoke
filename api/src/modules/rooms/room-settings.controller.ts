import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomSettingsService } from './room-settings.service';

@Controller('room-settings')
@UseGuards(JwtAuthGuard)
export class RoomSettingsController {
    constructor(private readonly settingsService: RoomSettingsService) { }

    // --- TYPES ---
    @Get('types')
    getTypes() {
        return this.settingsService.getTypes();
    }

    @Post('types')
    createType(@Request() req: any, @Body() body: { name: string, description?: string }) {
        return this.settingsService.createType(body, req.user.id);
    }

    updateType(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string, description?: string }) {
        return this.settingsService.updateType(id, body, req.user.id);
    }

    @Delete('types/:id')
    deleteType(@Request() req: any, @Param('id') id: string) {
        return this.settingsService.deleteType(id);
    }

    // --- FEATURES ---
    @Get('features')
    getFeatures() {
        return this.settingsService.getFeatures();
    }

    @Post('features')
    createFeature(@Request() req: any, @Body() body: { name: string, icon?: string }) {
        return this.settingsService.createFeature(body, req.user.id);
    }

    @Put('features/:id')
    updateFeature(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string, icon?: string }) {
        return this.settingsService.updateFeature(id, body, req.user.id);
    }

    @Delete('features/:id')
    deleteFeature(@Request() req: any, @Param('id') id: string) {
        return this.settingsService.deleteFeature(id);
    }
}
