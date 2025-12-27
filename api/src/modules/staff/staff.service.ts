import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staff)
        private staffRepository: Repository<Staff>,
        private auditService: AuditService,
    ) { }

    async create(createStaffDto: CreateStaffDto, createdByRole: string, createdByOrgId: number) {
        // Check if email or username already exists
        const existing = await this.staffRepository.findOne({
            where: [
                { email: createStaffDto.email },
                { username: createStaffDto.username }
            ]
        });

        if (existing) {
            throw new ConflictException('Email or username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);

        // Determine organizationId
        let organizationId: number | undefined = createStaffDto.organizationId;
        if (createStaffDto.role === 'sysadmin') {
            organizationId = undefined; // Sysadmin has no organization
        } else if (!organizationId && createdByRole !== 'sysadmin') {
            organizationId = createdByOrgId; // Use creator's organization
        }

        const staff = this.staffRepository.create({
            ...createStaffDto,
            password: hashedPassword,
            organizationId,
        });

        const saved = await this.staffRepository.save(staff);

        // Audit log
        await this.auditService.log({
            action: 'STAFF_CREATED',
            resource: 'Staff',
            resourceId: saved.id.toString(),
            details: { username: saved.username, role: saved.role }
        });

        const { password, ...result } = saved;
        return result;
    }

    async findAll(organizationId?: number) {
        const where: any = {};
        if (organizationId) {
            where.organizationId = organizationId;
        }

        return this.staffRepository.find({
            where,
            select: ['id', 'email', 'username', 'name', 'phone', 'role', 'organizationId', 'isActive', 'createdAt'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: number) {
        const staff = await this.staffRepository.findOne({
            where: { id },
            relations: ['organization']
        });

        if (!staff) {
            throw new NotFoundException('Staff not found');
        }

        const { password, ...result } = staff;
        return result;
    }

    async update(id: number, updateDto: Partial<CreateStaffDto>, updaterRole: string) {
        const staff = await this.staffRepository.findOne({ where: { id } });

        if (!staff) {
            throw new NotFoundException('Staff not found');
        }

        // Only sysadmin can change role
        if (updateDto.role && updaterRole !== 'sysadmin') {
            throw new ForbiddenException('Only sysadmin can change staff roles');
        }

        if (updateDto.password) {
            updateDto.password = await bcrypt.hash(updateDto.password, 10);
        }

        Object.assign(staff, updateDto);
        const updated = await this.staffRepository.save(staff);

        const { password, ...result } = updated;
        return result;
    }

    async deactivate(id: number) {
        const staff = await this.staffRepository.findOne({ where: { id } });
        if (!staff) {
            throw new NotFoundException('Staff not found');
        }

        staff.isActive = false;
        await this.staffRepository.save(staff);
        return { message: 'Staff deactivated successfully' };
    }
}
