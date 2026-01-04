import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    CUSTOMER = 'customer',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({ unique: true })
    phone: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role: UserRole;

    @Column({ name: 'loyalty_points', default: 0 })
    loyaltyPoints: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;
}
