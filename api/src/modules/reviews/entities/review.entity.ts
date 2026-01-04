import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Venue } from '../../venues/entities/venue.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'venueId' })
    venueId: number;

    @Column({ name: 'userId', nullable: true })
    userId: number;

    @Column({ name: 'userName' })
    userName: string;

    @Column()
    rating: number;

    @Column('text')
    comment: string;

    @Column({ default: false })
    verified: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: number;

    @ManyToOne(() => Venue, (venue) => venue.reviews)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;
}
