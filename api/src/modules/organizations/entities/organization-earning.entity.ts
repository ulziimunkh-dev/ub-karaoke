import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { PaymentTransaction } from '../../payments/entities/payment-transaction.entity';

export enum EarningStatus {
  PENDING = 'PENDING',
  AVAILABLE = 'AVAILABLE',
  PAID = 'PAID',
  REVERSED = 'REVERSED',
}

@Entity('organization_earnings')
export class OrganizationEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'payment_transaction_id', nullable: true })
  paymentTransactionId: string;

  @ManyToOne(() => PaymentTransaction, { nullable: true })
  @JoinColumn({ name: 'payment_transaction_id' })
  paymentTransaction: PaymentTransaction;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'gross_amount' })
  grossAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'platform_fee' })
  platformFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_amount' })
  netAmount: number;

  @Column({ length: 3, default: 'MNT' })
  currency: string;

  @Column({
    type: 'enum',
    enum: EarningStatus,
    default: EarningStatus.PENDING,
  })
  status: EarningStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
