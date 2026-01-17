import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum RefundStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('refunds')
export class Refund {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paymentId' })
    paymentId: number;

    @ManyToOne(() => Payment, (payment) => payment.refunds)
    @JoinColumn({ name: 'paymentId' })
    payment: Payment;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    reason: string;

    @Column({
        type: 'enum',
        enum: RefundStatus,
        default: RefundStatus.PENDING,
    })
    status: RefundStatus;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
