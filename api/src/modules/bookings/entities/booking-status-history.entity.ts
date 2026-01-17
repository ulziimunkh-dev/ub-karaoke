import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingStatus } from '../enums/booking.enums';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('booking_status_history')
export class BookingStatusHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'bookingId' })
    bookingId: number;

    @ManyToOne(() => Booking, (booking) => booking.statusHistory, { onDelete: 'CASCADE' })
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
    changedBy: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'changedBy' })
    user: User;

    @CreateDateColumn({ name: 'changedAt' })
    changedAt: Date;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: number;
}
