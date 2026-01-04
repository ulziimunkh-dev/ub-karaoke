import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Venue } from '../../venues/entities/venue.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 10 })
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => Staff, staff => staff.organization)
    staff: Staff[];

    @OneToMany(() => Venue, venue => venue.organization)
    venues: Venue[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;
}
