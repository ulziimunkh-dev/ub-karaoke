import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationPayoutAccount } from './organization-payout-account.entity';
import { OrganizationPayoutItem } from './organization-payout-item.entity';

export enum PayoutStatus {
    REQUESTED = 'REQUESTED',
    PROCESSING = 'PROCESSING',
    PAID = 'PAID',
    FAILED = 'FAILED',
}

@Entity('organization_payouts')
export class OrganizationPayout {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id' })
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'payout_account_id', nullable: true })
    payoutAccountId: string;

    @ManyToOne(() => OrganizationPayoutAccount, { nullable: true })
    @JoinColumn({ name: 'payout_account_id' })
    payoutAccount: OrganizationPayoutAccount;

    @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
    totalAmount: number;

    @Column({ type: 'date', name: 'payout_period_start' })
    payoutPeriodStart: Date;

    @Column({ type: 'date', name: 'payout_period_end' })
    payoutPeriodEnd: Date;

    @Column({
        type: 'enum',
        enum: PayoutStatus,
        default: PayoutStatus.REQUESTED,
    })
    status: PayoutStatus;

    @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
    processedAt: Date;

    @OneToMany(() => OrganizationPayoutItem, (item) => item.payout)
    items: OrganizationPayoutItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;
}
