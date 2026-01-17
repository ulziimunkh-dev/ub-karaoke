import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
