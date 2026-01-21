import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Account } from './account.entity';

export enum ReferenceType {
    BOOKING = 'BOOKING',
    PAYMENT = 'PAYMENT',
    PAYOUT = 'PAYOUT',
    REFUND = 'REFUND',
}

@Entity('ledger_entries')
export class LedgerEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'account_id' })
    accountId: string;

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @Column({
        type: 'enum',
        enum: ReferenceType,
        name: 'reference_type',
        nullable: true,
    })
    referenceType: ReferenceType;

    @Column({ name: 'reference_id', nullable: true })
    referenceId: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    debit: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    credit: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
