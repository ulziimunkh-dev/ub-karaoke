import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Venue } from '../../venues/entities/venue.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../auth/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';
import { BookingStatusHistory } from './booking-status-history.entity';
import { BookingPromotion } from './booking-promotion.entity';
import {
  BookingStatus,
  BookingPaymentStatus,
  BookingSource,
} from '../enums/booking.enums';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId', nullable: true })
  userId: string;

  @Column({ name: 'roomId' })
  roomId: string;

  @Column({ name: 'venueId' })
  venueId: string;

  @Column({ name: 'startTime', type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ name: 'endTime', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'totalPrice', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ name: 'loyalty_points_used', type: 'int', default: 0 })
  loyaltyPointsUsed: number;

  @Column({
    name: 'loyalty_discount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  loyaltyDiscount: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: BookingSource,
    default: BookingSource.ONLINE,
  })
  source: BookingSource;

  @Column({ name: 'customerName' })
  customerName: string;

  @Column({ name: 'customerPhone' })
  customerPhone: string;

  @Column({ name: 'specialRequests', type: 'text', nullable: true })
  specialRequests: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'reserved_at', type: 'timestamp', nullable: true })
  reservedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'payment_completed_at', type: 'timestamp', nullable: true })
  paymentCompletedAt: Date;

  @Column({ name: 'extension_count', type: 'int', default: 0 })
  extensionCount: number;

  @Column({ name: 'group_id', nullable: true })
  groupId: string;

  @Column({ name: 'blocked_until', type: 'timestamp', nullable: true })
  blockedUntil: Date;

  @Column({ name: 'override_reason', type: 'text', nullable: true })
  overrideReason: string;

  @Column({ name: 'override_staff_id', nullable: true })
  overrideStaffId: string;

  @ManyToOne(() => Room, (room) => room.bookings)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => Venue)
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @ManyToOne(() => Promotion, { nullable: true })
  @JoinColumn({ name: 'appliedPromotionId' })
  promotion: Promotion;

  @Column({ name: 'appliedPromotionId', nullable: true })
  appliedPromotionId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @OneToMany(() => BookingStatusHistory, (history) => history.booking)
  statusHistory: BookingStatusHistory[];

  @OneToMany(
    () => BookingPromotion,
    (bookingPromotion) => bookingPromotion.booking,
  )
  promotions: BookingPromotion[];
}
