import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';

export enum PayoutProvider {
    BANK = 'BANK',
    QPAY = 'QPAY',
}

export enum PayoutAccountStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    DISABLED = 'DISABLED',
}

@Entity('organization_payout_accounts')
export class OrganizationPayoutAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @ManyToOne(() => Organization, (org) => org.payoutAccounts)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({
        type: 'enum',
        enum: PayoutProvider,
    })
    provider: PayoutProvider;

    @Column({ name: 'account_name', type: 'text', nullable: true })
    accountName: string;

    @Column({ name: 'account_number', type: 'text', nullable: true })
    accountNumber: string;

    @Column({ name: 'bank_name', type: 'text', nullable: true })
    bankName: string;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column({
        type: 'enum',
        enum: PayoutAccountStatus,
        default: PayoutAccountStatus.PENDING,
    })
    status: PayoutAccountStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;
}
