import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum PaymentProvider {
    QPAY = 'QPAY',
    CARD = 'CARD',
    CASH = 'CASH',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

@Entity('payment_transactions')
export class PaymentTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'paymentId' })
    paymentId: string;

    @ManyToOne(() => Payment, (payment) => payment.transactions)
    @JoinColumn({ name: 'paymentId' })
    payment: Payment;

    @Column({
        type: 'enum',
        enum: PaymentProvider,
    })
    provider: PaymentProvider;

    @Column({ name: 'providerTxId', nullable: true })
    providerTxId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;

    @Column('jsonb', { name: 'rawResponse', nullable: true })
    rawResponse: any;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
