import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'venue_id' })
    venueId: number;

    @ManyToOne(() => Venue)
    @JoinColumn({ name: 'venue_id' })
    venue: Venue;

    @Column({ name: 'room_id', nullable: true })
    roomId: number | null;

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

    @Column({ default: 1 })
    priority: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;
}
