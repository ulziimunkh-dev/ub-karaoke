import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Venue } from './venue.entity';

export enum DayOfWeek {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY',
}

@Entity('venue_operating_hours')
export class VenueOperatingHours {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'venue_id' })
    venueId: string;

    @ManyToOne(() => Venue, (venue) => venue.operatingHours)
    @JoinColumn({ name: 'venue_id' })
    venue: Venue;

    @Column({
        type: 'enum',
        enum: DayOfWeek,
        name: 'day_of_week',
    })
    dayOfWeek: DayOfWeek;

    @Column({ type: 'time', name: 'open_time' })
    openTime: string;

    @Column({ type: 'time', name: 'close_time' })
    closeTime: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
