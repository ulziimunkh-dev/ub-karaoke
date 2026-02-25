import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
  ) {}

  async create(
    createStaffDto: CreateStaffDto,
    createdByRole: string,
    createdByOrgId: string,
    createdByStaffId?: string,
  ) {
    // Determine organizationId first
    let organizationId: string | undefined = createStaffDto.organizationId;
    if (createStaffDto.role === 'sysadmin') {
      organizationId = undefined; // Sysadmin has no organization
    } else if (!organizationId && createdByRole !== 'sysadmin') {
      organizationId = createdByOrgId; // Use creator's organization
    }

    // Check if username exists within the same organization
    const existingUsername = await this.staffRepository.findOne({
      where: {
        username: createStaffDto.username,
        organizationId: organizationId || IsNull(),
      },
    });

    if (existingUsername) {
      throw new ConflictException(
        'Username already exists in this organization',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);

    const staff = this.staffRepository.create({
      ...createStaffDto,
      password: hashedPassword,
      organizationId,
      createdBy: createdByStaffId,
    });

    const saved = await this.staffRepository.save(staff);

    // Audit log
    await this.auditService.log({
      action: 'STAFF_CREATED',
      resource: 'Staff',
      resourceId: saved.id,
      details: { username: saved.username, role: saved.role },
      actorId: createdByStaffId,
      actorType: 'STAFF',
      organizationId: saved.organizationId,
    });

    return this.findOne(saved.id);
  }

  async findAll(organizationId?: string) {
    return await this.staffRepository.find({
      where: organizationId ? { organizationId } : {},
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          id: true,
          name: true,
        },
      },
      relations: {
        organization: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const staff = await this.staffRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const { password, ...result } = staff;
    return result;
  }

  async update(
    id: string,
    updateDto: Partial<CreateStaffDto>,
    updaterRole: string,
    updatedByStaffId?: string,
  ) {
    const staff = await this.staffRepository.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (updateDto.username && updateDto.username !== staff.username) {
      const existing = await this.staffRepository.findOne({
        where: {
          username: updateDto.username,
          organizationId: staff.organizationId || IsNull(),
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Username already exists in this organization',
        );
      }
    }

    // Only sysadmin can change role
    if (
      updateDto.role &&
      updateDto.role !== staff.role &&
      updaterRole !== 'sysadmin'
    ) {
      throw new ForbiddenException('Only sysadmin can change staff roles');
    }

    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    Object.assign(staff, updateDto);
    if (updatedByStaffId) {
      staff.updatedBy = updatedByStaffId;
    }
    const updated = await this.staffRepository.save(staff);

    // Audit log
    await this.auditService.log({
      action: 'STAFF_UPDATED',
      resource: 'Staff',
      resourceId: id,
      details: updateDto,
      actorId: updatedByStaffId,
      actorType: 'STAFF',
      organizationId: updated.organizationId,
    });

    return this.findOne(updated.id);
  }

  async deactivate(id: string) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isActive = false;
    await this.staffRepository.save(staff);

    // Audit log
    await this.auditService.log({
      action: 'STAFF_DEACTIVATED',
      resource: 'Staff',
      resourceId: id,
      details: { isActive: false },
      organizationId: staff.organizationId,
    });

    return { message: 'Staff deactivated successfully' };
  }
}
