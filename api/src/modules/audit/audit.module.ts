import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';
import { Staff } from '../staff/entities/staff.entity';
import { User } from '../auth/entities/user.entity';

@Global() // Make it global so we can inject AuditService everywhere easily
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Staff, User])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
