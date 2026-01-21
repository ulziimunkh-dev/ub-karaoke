import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    action: string;

    @Column()
    resource: string; // e.g., 'Booking', 'Payment'

    @Column({ name: 'resourceId', nullable: true })
    resourceId: string;

    @Column('jsonb', { nullable: true })
    details: any;

    @Column({ name: 'userId', nullable: true })
    userId: string; // Can be User ID or Staff ID (if no strict FK needed, or used for logic)

    // Keeping User FK for customers
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'staffId', nullable: true })
    staffId: string;

    @ManyToOne(() => Staff, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'staffId' })
    staff: Staff;

    @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: string;

    @Column({ name: 'ipAddress', nullable: true })
    ipAddress: string;

    @Column({ name: 'userAgent', nullable: true })
    userAgent: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
