import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { BookingStatus } from '../enums/booking.enums';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../auth/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity('booking_status_history')
export class BookingStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bookingId' })
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({
    type: 'enum',
    enum: BookingStatus,
  })
  oldStatus: BookingStatus;

  @Column({
    type: 'enum',
    enum: BookingStatus,
  })
  newStatus: BookingStatus;

  @Column({ name: 'changedBy', nullable: true })
  changedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changedBy' })
  user: User;

  @Column({ name: 'changedByStaffId', nullable: true })
  changedByStaffId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'changedByStaffId' })
  staff: Staff;

  @CreateDateColumn({ name: 'changedAt', type: 'timestamp' })
  changedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    name: 'organization_id',
    nullable: true,
    insert: false,
    update: false,
  })
  organizationId: string;
}
