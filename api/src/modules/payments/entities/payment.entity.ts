import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    ONLINE = 'ONLINE', // Mock online
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'MNT' })
    currency: string;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
    })
    method: PaymentMethod;

    @Column({ name: 'transactionId', nullable: true })
    transactionId: string;

    @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column({ name: 'bookingId', nullable: true })
    bookingId: number;

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
