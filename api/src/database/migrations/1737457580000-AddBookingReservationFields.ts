import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBookingReservationFields1737457580000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to bookings table
        await queryRunner.addColumn('bookings', new TableColumn({
            name: 'reserved_at',
            type: 'timestamp',
            isNullable: true,
        }));

        await queryRunner.addColumn('bookings', new TableColumn({
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
        }));

        await queryRunner.addColumn('bookings', new TableColumn({
            name: 'payment_completed_at',
            type: 'timestamp',
            isNullable: true,
        }));

        await queryRunner.addColumn('bookings', new TableColumn({
            name: 'extension_count',
            type: 'int',
            default: 0,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse the migration
        await queryRunner.dropColumn('bookings', 'reserved_at');
        await queryRunner.dropColumn('bookings', 'expires_at');
        await queryRunner.dropColumn('bookings', 'payment_completed_at');
        await queryRunner.dropColumn('bookings', 'extension_count');
    }
}
