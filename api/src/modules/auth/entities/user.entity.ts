import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    CUSTOMER = 'customer',
    USER = 'user',
    ADMIN = 'admin',
    STAFF = 'staff',
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

    @Column({ default: false })
    isVerified: boolean;

    @Column({ type: 'varchar', nullable: true })
    verificationCode: string | null;

    @Column({ type: 'timestamp', nullable: true })
    verificationCodeExpires: Date | null;

    @Column({ type: 'varchar', nullable: true })
    resetToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    resetTokenExpires: Date | null;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role: UserRole;

    @Column({ default: 0 })
    loyaltyPoints: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
