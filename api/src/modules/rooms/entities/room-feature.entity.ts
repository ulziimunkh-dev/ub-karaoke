import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Room } from './room.entity';

@Entity('room_features')
export class RoomFeature {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    icon: string; // Emoji character or icon class name

    @Column({ name: 'organization_id' })
    organizationId: number;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToMany(() => Room, (room) => room.roomFeatures)
    rooms: Room[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;
}
