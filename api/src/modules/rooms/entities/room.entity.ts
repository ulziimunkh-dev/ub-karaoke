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
import { Venue } from '../../venues/entities/venue.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { RoomType } from './room-type.entity';
import { RoomFeature } from './room-feature.entity';
import { ManyToMany, JoinTable } from 'typeorm';
import { RoomPricing } from './room-pricing.entity';
import { RoomImage } from './room-image.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'venueId' })
    venueId: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    type: string; // Standard, VIP, Party, Themed, Small

    @Column()
    capacity: number;

    @Column('decimal', { name: 'hourlyRate', precision: 10, scale: 2 })
    hourlyRate: number;

    @Column({ name: 'isVIP', default: false })
    isVIP: boolean;

    @Column()
    condition: string;

    @Column('jsonb', { name: 'amenities' })
    amenities: string[];

    // @Column('jsonb', { name: 'features', nullable: true })
    // features: string[];

    @Column('jsonb', { name: 'images', nullable: true })
    /**
     * @deprecated Use imagesList instead
     */
    images: string[];

    @Column('jsonb', { name: 'specs', nullable: true })
    specs: {
        microphones?: number;
        speaker?: string;
        screen?: number;
        seating?: string;
        ac?: string;
        sound?: string;
        lighting?: string[];
        cleaning?: number;
    };

    @Column('jsonb', { name: 'partySupport', nullable: true })
    partySupport: {
        birthday?: boolean;
        decoration?: boolean;
    };

    @Column({ name: 'view360Url', nullable: true })
    view360Url: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;

    @ManyToOne(() => Venue, (venue) => venue.rooms)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: number;

    @OneToMany(() => Booking, (booking) => booking.room)
    bookings: Booking[];

    @ManyToOne(() => RoomType, (type) => type.rooms, { nullable: true })
    @JoinColumn({ name: 'roomTypeId' })
    roomType: RoomType;

    @Column({ nullable: true })
    roomTypeId: number;

    @ManyToMany(() => RoomFeature, (feature) => feature.rooms)
    @JoinTable({
        name: 'room_features_rooms',
        joinColumn: { name: 'roomId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'featureId', referencedColumnName: 'id' }
    })
    roomFeatures: RoomFeature[];

    @OneToMany(() => RoomPricing, (pricing) => pricing.room)
    pricing: RoomPricing[];

    @OneToMany(() => RoomImage, (image) => image.room)
    imagesList: RoomImage[];
}
