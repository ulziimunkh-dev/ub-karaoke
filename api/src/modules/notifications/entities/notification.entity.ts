import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum NotificationType {
    SMS = 'SMS',
    EMAIL = 'EMAIL',
    PUSH = 'PUSH',
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'userId', nullable: true })
    userId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'staffId', nullable: true })
    staffId: string;

    @ManyToOne(() => Staff, { nullable: true })
    @JoinColumn({ name: 'staffId' })
    staff: Staff;

    @Column({ name: 'bookingId', nullable: true })
    bookingId: string;

    @ManyToOne(() => Booking, { nullable: true })
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
    })
    status: NotificationStatus;

    @Column({ type: 'text', nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ type: 'timestamp', nullable: true })
    readAt: Date;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
