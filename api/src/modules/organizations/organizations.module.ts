import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { FinanceController } from './finance.controller';
import { Organization } from './entities/organization.entity';
import { AuditModule } from '../audit/audit.module';
import { PlansModule } from '../plans/plans.module';
import { OrganizationPlanHistory } from './entities/organization-plan-history.entity';
import { OrganizationPayoutAccount } from './entities/organization-payout-account.entity';
import { OrganizationEarning } from './entities/organization-earning.entity';
import { OrganizationPayout } from './entities/organization-payout.entity';
import { OrganizationPayoutItem } from './entities/organization-payout-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Organization, OrganizationPlanHistory, OrganizationPayoutAccount, OrganizationEarning, OrganizationPayout, OrganizationPayoutItem]),
        AuditModule,
        PlansModule,
    ],
    controllers: [OrganizationsController, FinanceController],
    providers: [OrganizationsService],
    exports: [OrganizationsService],
})
export class OrganizationsModule { }
