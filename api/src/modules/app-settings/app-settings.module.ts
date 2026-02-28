import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { AppSettingsService } from './app-settings.service';
import { AppSettingsController } from './app-settings.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([SystemSetting])],
    providers: [AppSettingsService],
    controllers: [AppSettingsController],
    exports: [AppSettingsService],
})
export class AppSettingsModule { }
