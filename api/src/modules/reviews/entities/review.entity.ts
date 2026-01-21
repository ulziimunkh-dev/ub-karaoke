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
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'venueId' })
    venueId: string;

    @Column({ name: 'userId', nullable: true })
    userId: string;

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
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: string;

    @ManyToOne(() => Venue, (venue) => venue.reviews)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;
}
