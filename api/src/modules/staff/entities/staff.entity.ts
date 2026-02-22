import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum StaffRole {
    SYSADMIN = 'sysadmin',
    MANAGER = 'manager',
    STAFF = 'staff',
}

@Entity('staff')
@Unique(['username', 'organizationId'])
export class Staff {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ type: 'enum', enum: StaffRole })
    role: StaffRole;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: string;

    @ManyToOne(() => Organization, org => org.staff, { nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;
}
