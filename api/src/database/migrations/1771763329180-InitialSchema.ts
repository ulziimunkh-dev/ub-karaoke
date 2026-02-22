import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771763329180 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This is the baseline migration.
        // Current schema is already synchronized with entities.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
