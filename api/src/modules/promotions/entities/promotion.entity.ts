import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum DiscountType {
    PERCENT = 'PERCENT',
    FIXED = 'FIXED',
}

@Entity('promotions')
export class Promotion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({
        type: 'enum',
        enum: DiscountType,
    })
    discountType: DiscountType;

    @Column('decimal', { precision: 10, scale: 2 })
    value: number;

    @Column({ type: 'timestamp' })
    validFrom: Date;

    @Column({ type: 'timestamp' })
    validTo: Date;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: string;

    @Column({ name: 'venueId', nullable: true })
    venueId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;
}
