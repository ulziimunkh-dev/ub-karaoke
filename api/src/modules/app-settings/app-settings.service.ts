import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class AppSettingsService {
    constructor(
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
    ) { }

    async getSettings(): Promise<Record<string, any>> {
        const settings = await this.settingsRepository.find();
        return settings.reduce((acc: Record<string, any>, curr) => {
            try {
                acc[curr.key] = JSON.parse(curr.value);
            } catch {
                acc[curr.key] = curr.value;
            }
            return acc;
        }, {});
    }

    async getSetting(key: string, defaultValue?: any): Promise<any> {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        if (!setting) return defaultValue;
        try {
            return JSON.parse(setting.value);
        } catch {
            return setting.value;
        }
    }

    async updateSetting(key: string, value: any, description?: string): Promise<SystemSetting> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        let setting = await this.settingsRepository.findOne({ where: { key } });

        if (setting) {
            setting.value = stringValue;
            if (description) setting.description = description;
        } else {
            setting = this.settingsRepository.create({
                key,
                value: stringValue,
                description,
            });
        }

        return this.settingsRepository.save(setting);
    }

    async updateSettings(settings: Record<string, any>): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.updateSetting(key, value);
        }
    }
}
