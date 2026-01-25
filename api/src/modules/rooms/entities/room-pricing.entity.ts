import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Room } from './room.entity';
import { Venue } from '../../venues/entities/venue.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum DayType {
    WEEKDAY = 'WEEKDAY',
    WEEKEND = 'WEEKEND',
    HOLIDAY = 'HOLIDAY',
}

@Entity('room_pricing')
export class RoomPricing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id' })
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'venue_id' })
    venueId: string;

    @ManyToOne(() => Venue)
    @JoinColumn({ name: 'venue_id' })
    venue: Venue;

    @Column({ name: 'room_id', nullable: true })
    roomId: string | null;

    @ManyToOne(() => Room, (room) => room.pricing, { nullable: true })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @Column({
        name: 'day_type',
        type: 'varchar',
        length: 20,
    })
    dayType: DayType;

    @Column({ name: 'start_time', type: 'time' })
    startTime: string;

    @Column({ name: 'end_time', type: 'time' })
    endTime: string;

    @Column('numeric', { name: 'price_per_hour', precision: 12, scale: 2 })
    pricePerHour: number;

    @Column({ name: 'start_datetime', type: 'timestamp', nullable: true })
    startDateTime: Date;

    @Column({ name: 'end_datetime', type: 'timestamp', nullable: true })
    endDateTime: Date;

    @Column({ default: 1 })
    priority: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
    deletedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;
}
