import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { VenueOperatingHours } from './venue-operating-hours.entity';
import { RoomPricing } from '../../rooms/entities/room-pricing.entity';

@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  address: string;

  @Column()
  district: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'priceRange', nullable: true })
  priceRange: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'totalReviews', default: 0 })
  totalReviews: number;

  @Column('jsonb', { name: 'amenities' })
  amenities: string[];

  @Column('jsonb', { name: 'openingHours' })
  openingHours: Record<string, string>;

  @Column('jsonb', { name: 'images' })
  images: string[];

  @Column({ name: 'featuredImage', nullable: true })
  featuredImage: string;

  @Column({ name: 'gmap_location', nullable: true })
  gmapLocation: string;

  latitude: number | null;
  longitude: number | null;

  @AfterLoad()
  populateCoordinates() {
    if (this.gmapLocation && typeof this.gmapLocation === 'string') {
      let lat: number | null = null;
      let lng: number | null = null;

      // Try plain "lat, lng" format first (e.g. "47.9188, 106.9176")
      const coords = this.gmapLocation.split(',').map((s) => s.trim());
      if (coords.length === 2) {
        const parsedLat = parseFloat(coords[0]);
        const parsedLng = parseFloat(coords[1]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && Math.abs(parsedLat) <= 90 && Math.abs(parsedLng) <= 180) {
          lat = parsedLat;
          lng = parsedLng;
        }
      }

      // If plain format didn't work, try extracting from Google Maps URL (e.g. @47.9188,106.9176)
      if (lat === null && this.gmapLocation.includes('http')) {
        const match = this.gmapLocation.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
      }

      this.latitude = lat;
      this.longitude = lng;
    } else {
      this.latitude = null;
      this.longitude = null;
    }
  }

  @Column({ name: 'isBookingEnabled', default: true })
  isBookingEnabled: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'bookingWindowStart', nullable: true })
  bookingWindowStart: string;

  @Column({ name: 'bookingWindowEnd', nullable: true })
  bookingWindowEnd: string;

  @Column({ name: 'advanceBookingDays', default: 3 })
  advanceBookingDays: number;

  @Column('decimal', {
    name: 'minBookingHours',
    precision: 5,
    scale: 2,
    default: 1.0,
  })
  minBookingHours: number;

  @Column('decimal', {
    name: 'maxBookingHours',
    precision: 5,
    scale: 2,
    default: 6.0,
  })
  maxBookingHours: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @ManyToOne(() => Organization, (org) => org.venues)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @OneToMany(() => Room, (room) => room.venue)
  rooms: Room[];

  @OneToMany(() => Review, (review) => review.venue)
  reviews: Review[];

  @OneToMany(() => VenueOperatingHours, (hours) => hours.venue)
  operatingHours: VenueOperatingHours[];

  @OneToMany(() => RoomPricing, (pricing) => pricing.venue)
  pricing: RoomPricing[];
}
