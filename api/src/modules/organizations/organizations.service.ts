import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuditService } from '../audit/audit.service';

import { PlansService } from '../plans/plans.service';
import { OrganizationPlanHistory } from './entities/organization-plan-history.entity';
import { OrganizationPayoutAccount } from './entities/organization-payout-account.entity';
import { OrganizationEarning } from './entities/organization-earning.entity';
import { OrganizationPayout } from './entities/organization-payout.entity';
import { OrganizationPayoutItem } from './entities/organization-payout-item.entity';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationPlanHistory)
    private planHistoryRepository: Repository<OrganizationPlanHistory>,
    @InjectRepository(OrganizationPayoutAccount)
    private payoutAccountsRepository: Repository<OrganizationPayoutAccount>,
    @InjectRepository(OrganizationEarning)
    private earningsRepository: Repository<OrganizationEarning>,
    @InjectRepository(OrganizationPayout)
    private payoutsRepository: Repository<OrganizationPayout>,
    @InjectRepository(OrganizationPayoutItem)
    private payoutItemsRepository: Repository<OrganizationPayoutItem>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private auditService: AuditService,
    private plansService: PlansService,
    private appSettingsService: AppSettingsService,
    private notificationsService: NotificationsService,
  ) { }

  async create(
    createOrganizationDto: CreateOrganizationDto,
    createdByStaffId: string,
  ) {
    // Check if code already exists
    const existing = await this.organizationsRepository.findOne({
      where: { code: createOrganizationDto.code },
    });

    if (existing) {
      throw new ConflictException('Organization code already exists');
    }

    const organization = this.organizationsRepository.create({
      ...createOrganizationDto,
      code: createOrganizationDto.code.toUpperCase(),
      createdBy: createdByStaffId,
    });

    // Handle Plan Assignment
    let selectedPlan = null;
    if (createOrganizationDto.planId) {
      try {
        selectedPlan = await this.plansService.findOne(
          createOrganizationDto.planId,
        );
        organization.plan = selectedPlan;
        organization.planStartedAt = new Date();
        organization.status = 'active';
        // Default 1 month subscription
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        organization.planEndsAt = endDate;
      } catch (error) {
        console.warn(
          `Plan ${createOrganizationDto.planId} not found, proceeding without plan.`,
        );
      }
    }

    const saved = await this.organizationsRepository.save(organization);

    // Save initial plan history
    if (selectedPlan) {
      await this.planHistoryRepository.save({
        organizationId: saved.id,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.monthlyFee,
        commissionRate: selectedPlan.commissionRate || 0,
        startDate: new Date(),
        status: 'active',
      });
    }

    // Audit log
    await this.auditService.log({
      action: 'ORGANIZATION_CREATED',
      resource: 'Organization',
      resourceId: saved.id,
      details: {
        code: saved.code,
        name: saved.name,
        planId: createOrganizationDto.planId,
      },
      actorId: createdByStaffId,
      actorType: 'STAFF',
      organizationId: saved.id,
    });

    return saved;
  }

  async findAll(filters?: { includeInactive?: boolean }) {
    const query: any = {
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    };

    if (!filters?.includeInactive) {
      query.where = { isActive: true };
    }

    return this.organizationsRepository.find(query);
  }

  async findOne(id: string) {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['staff', 'venues', 'plan'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    updateDto: Partial<CreateOrganizationDto>,
    updatedByStaffId?: string,
  ) {
    const organization = await this.findOne(id);
    const oldPlanId = organization.plan?.id;

    Object.assign(organization, updateDto);

    // Handle Plan Update
    if (updateDto.planId && updateDto.planId !== oldPlanId) {
      const plan = await this.plansService.findOne(updateDto.planId);

      // Close previous history if exists
      const currentHistory = await this.planHistoryRepository.findOne({
        where: { organizationId: id, status: 'active' },
        order: { startDate: 'DESC' },
      });

      if (currentHistory) {
        currentHistory.endDate = new Date();
        currentHistory.status = 'completed';
        await this.planHistoryRepository.save(currentHistory);
      }

      // Create new history
      await this.planHistoryRepository.save({
        organizationId: id,
        planId: plan.id,
        planName: plan.name,
        price: plan.monthlyFee,
        commissionRate: plan.commissionRate || 0,
        startDate: new Date(),
        status: 'active',
      });

      organization.plan = plan;
      organization.planStartedAt = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      organization.planEndsAt = endDate;
      organization.status = 'active';
    }

    // Allow manual date updates
    if (updateDto.planStartedAt) {
      organization.planStartedAt = updateDto.planStartedAt;
    }
    if (updateDto.planEndsAt) {
      organization.planEndsAt = updateDto.planEndsAt;
    }

    // Sync active history dates if dates changed (either by plan change or manual update)
    // Find current active history
    const activeHistory = await this.planHistoryRepository.findOne({
      where: { organizationId: id, status: 'active' },
      order: { startDate: 'DESC' },
    });

    if (activeHistory) {
      if (updateDto.planStartedAt)
        activeHistory.startDate = updateDto.planStartedAt;
      if (updateDto.planEndsAt) activeHistory.endDate = updateDto.planEndsAt;
      await this.planHistoryRepository.save(activeHistory);
    }

    if (updatedByStaffId) {
      organization.updatedBy = updatedByStaffId;
    }
    const updated = await this.organizationsRepository.save(organization);

    // Audit log
    await this.auditService.log({
      action: 'ORGANIZATION_UPDATED',
      resource: 'Organization',
      resourceId: id,
      details: updateDto,
      actorId: updatedByStaffId,
      actorType: 'STAFF',
      organizationId: id,
    });

    return updated;
  }

  async updateStatus(id: string, isActive: boolean, updatedByStaffId?: string) {
    const organization = await this.findOne(id);
    organization.isActive = isActive;
    if (updatedByStaffId) {
      organization.updatedBy = updatedByStaffId;
    }
    const updated = await this.organizationsRepository.save(organization);

    // Clear venue caches because venues depend on org status
    await this.cacheManager.del('venues:all');

    await this.auditService.log({
      action: 'ORGANIZATION_STATUS_UPDATED',
      resource: 'Organization',
      resourceId: id,
      details: { isActive },
      actorId: updatedByStaffId,
      actorType: 'STAFF',
      organizationId: id,
    });

    return updated;
  }

  async deactivate(id: string, updatedByStaffId?: string) {
    return this.updateStatus(id, false, updatedByStaffId);
  }

  async getPlanHistory(organizationId: string) {
    return this.planHistoryRepository.find({
      where: { organizationId },
      order: { startDate: 'DESC' },
    });
  }

  async addPayoutAccount(
    organizationId: string,
    accountData: Partial<OrganizationPayoutAccount>,
    userId: string,
  ) {
    const organization = await this.findOne(organizationId);

    // If this is the first account or marked as default, make it default
    const existingAccounts = await this.payoutAccountsRepository.find({
      where: { organizationId },
    });

    if (accountData.isDefault || existingAccounts.length === 0) {
      // Unset other defaults
      await this.payoutAccountsRepository.update(
        { organizationId, isDefault: true },
        { isDefault: false },
      );
    }

    const account = this.payoutAccountsRepository.create({
      ...accountData,
      organizationId,
      createdBy: userId,
    });

    return this.payoutAccountsRepository.save(account);
  }

  async updatePayoutAccount(
    id: string,
    updateData: Partial<OrganizationPayoutAccount>,
    userId: string,
  ) {
    const account = await this.payoutAccountsRepository.findOne({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('Payout account not found');
    }

    // If setting as default, unset other defaults first
    if (updateData.isDefault) {
      await this.payoutAccountsRepository.update(
        { organizationId: account.organizationId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(account, updateData);
    account.updatedBy = userId;
    return this.payoutAccountsRepository.save(account);
  }

  async getPayoutAccounts(organizationId: string) {
    return this.payoutAccountsRepository.find({
      where: { organizationId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async removePayoutAccount(id: string) {
    const account = await this.payoutAccountsRepository.findOne({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('Payout account not found');
    }
    return this.payoutAccountsRepository.remove(account);
  }

  async recordEarning(data: Partial<OrganizationEarning>, userId?: string) {
    const earning = this.earningsRepository.create({
      ...data,
      createdBy: userId,
    });
    return this.earningsRepository.save(earning);
  }

  async getEarnings(
    organizationId: string,
    filters?: { status?: string; startDate?: Date; endDate?: Date },
  ) {
    const query = this.earningsRepository
      .createQueryBuilder('earning')
      .where('earning.organizationId = :organizationId', { organizationId });

    if (filters?.status) {
      query.andWhere('earning.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('earning.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('earning.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return query.orderBy('earning.createdAt', 'DESC').getMany();
  }

  async updateEarningStatus(id: string, status: string, userId?: string) {
    const earning = await this.earningsRepository.findOne({ where: { id } });
    if (!earning) {
      throw new NotFoundException('Earning record not found');
    }

    earning.status = status as any;
    if (userId) {
      earning.updatedBy = userId;
    }
    return this.earningsRepository.save(earning);
  }

  async getTotalEarnings(organizationId: string, status?: string) {
    const query = this.earningsRepository
      .createQueryBuilder('earning')
      .select('SUM(earning.netAmount)', 'total')
      .where('earning.organizationId = :organizationId', { organizationId });

    if (status) {
      query.andWhere('earning.status = :status', { status });
    }

    const result = await query.getRawOne();
    return parseFloat(result?.total || '0');
  }

  async createPayout(
    organizationId: string,
    data: Partial<OrganizationPayout>,
    earningIds?: string[],
    userId?: string,
    isSysAdmin: boolean = false,
  ) {
    const organization = await this.findOne(organizationId);

    // Calculate total from earnings if provided, otherwise use totalAmount from data
    let totalAmount = 0;
    let earnings: OrganizationEarning[] = [];
    if (earningIds && earningIds.length > 0) {
      earnings = await this.earningsRepository.findByIds(earningIds);
      totalAmount = earnings.reduce(
        (sum, earning) => sum + parseFloat(earning.netAmount.toString()),
        0,
      );
    } else {
      totalAmount = parseFloat(data.totalAmount?.toString() || '0');
    }

    // Check minimum payout limit (skip for sysadmins)
    if (!isSysAdmin) {
      const minLimit = await this.appSettingsService.getSetting('payout_min_limit', 0);
      if (totalAmount < minLimit) {
        throw new Error(`Payout amount (${totalAmount.toLocaleString()}₮) is below the minimum limit of ${minLimit.toLocaleString()}₮`);
      }
    }

    const payout = this.payoutsRepository.create({
      ...data,
      organizationId,
      totalAmount,
      createdBy: userId,
    });

    const savedPayout = await this.payoutsRepository.save(payout);

    // Create payout items if earnings provided
    if (earningIds && earningIds.length > 0) {
      const items = earningIds.map((earningId) => {
        const earning = earnings.find((e) => e.id === earningId);
        return this.payoutItemsRepository.create({
          payoutId: savedPayout.id,
          earningId,
          amount: earning?.netAmount || 0,
        });
      });

      await this.payoutItemsRepository.save(items);

      // Update earnings status to PAID
      await this.earningsRepository.update(earningIds, { status: 'PAID' as any });
    }

    // Notify admins
    await this.notificationsService.notifyAdminsOfPayoutRequest(savedPayout);

    return savedPayout;
  }

  async getPayouts(organizationId?: string, filters?: { status?: string }) {
    const query = this.payoutsRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.payoutAccount', 'account')
      .leftJoinAndSelect('payout.items', 'items');

    if (organizationId) {
      query.where('payout.organizationId = :organizationId', { organizationId });
    }

    if (filters?.status) {
      query.andWhere('payout.status = :status', { status: filters.status });
    }

    return query.orderBy('payout.createdAt', 'DESC').getMany();
  }

  async updatePayoutStatus(id: string, status: string, userId?: string) {
    const payout = await this.payoutsRepository.findOne({ where: { id } });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    payout.status = status as any;
    if (status === 'PAID' || status === 'FAILED') {
      payout.processedAt = new Date();
    }
    if (userId) {
      payout.updatedBy = userId;
    }
    return this.payoutsRepository.save(payout);
  }

  async extendPlan(
    organizationId: string,
    data: { planId: string; durationMonths: number },
    userId: string,
  ) {
    const organization = await this.findOne(organizationId);
    const plan = await this.plansService.findOne(data.planId);

    // If it's a new plan, replace the old one. If it's the same, just extend.
    const isSamePlan = organization.plan?.id === plan.id;

    const now = new Date();
    const currentEndDate =
      organization.planEndsAt && new Date(organization.planEndsAt) > now
        ? new Date(organization.planEndsAt)
        : now;

    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + data.durationMonths);

    // Update organization
    organization.plan = plan;
    organization.planEndsAt = newEndDate;
    if (!isSamePlan) {
      organization.planStartedAt = now;
      // Complete previous history
      const currentHistory = await this.planHistoryRepository.findOne({
        where: { organizationId, status: 'active' },
        order: { startDate: 'DESC' },
      });

      if (currentHistory) {
        currentHistory.endDate = now;
        currentHistory.status = 'completed';
        await this.planHistoryRepository.save(currentHistory);
      }

      // Create new history
      await this.planHistoryRepository.save({
        organizationId,
        planId: plan.id,
        planName: plan.name,
        price: plan.monthlyFee * data.durationMonths,
        commissionRate: plan.commissionRate || 0,
        startDate: now,
        endDate: newEndDate,
        status: 'active',
      });
    } else {
      // Update current active history
      const activeHistory = await this.planHistoryRepository.findOne({
        where: { organizationId, status: 'active' },
        order: { startDate: 'DESC' },
      });
      if (activeHistory) {
        activeHistory.endDate = newEndDate;
        activeHistory.price =
          Number(activeHistory.price || 0) +
          plan.monthlyFee * data.durationMonths;
        await this.planHistoryRepository.save(activeHistory);
      }
    }

    organization.status = 'active'; // Reactivate
    organization.updatedBy = userId;

    const saved = await this.organizationsRepository.save(organization);

    await this.auditService.log({
      action: 'PLAN_EXTENDED',
      resource: 'Organization',
      resourceId: organizationId,
      details: { ...data, newEndDate },
      actorId: userId,
      actorType: 'STAFF',
      organizationId: organizationId,
    });

    return saved;
  }
}
