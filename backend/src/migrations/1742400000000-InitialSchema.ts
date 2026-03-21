import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1742400000000 implements MigrationInterface {
  name = 'InitialSchema1742400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM ('CLIENT', 'ADMIN')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."appointment_status_enum" AS ENUM (
        'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."appointment_service_status_enum" AS ENUM (
        'PENDING', 'IN_PROGRESS', 'COMPLETED'
      )
    `);

    // Tabela: users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"           uuid                  NOT NULL DEFAULT gen_random_uuid(),
        "name"         character varying(255) NOT NULL,
        "email"        character varying(255) NOT NULL,
        "phone"        character varying(50)  NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "role"         "public"."user_role_enum" NOT NULL DEFAULT 'CLIENT',
        "createdAt"    TIMESTAMP             NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP             NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Tabela: services
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id"              uuid                  NOT NULL DEFAULT gen_random_uuid(),
        "name"            character varying(255) NOT NULL,
        "description"     text                  NOT NULL,
        "price"           numeric(10,2)         NOT NULL,
        "durationMinutes" integer               NOT NULL,
        "isActive"        boolean               NOT NULL DEFAULT true,
        "createdAt"       TIMESTAMP             NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id")
      )
    `);

    // Tabela: appointments
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id"            uuid                           NOT NULL DEFAULT gen_random_uuid(),
        "userId"        uuid                           NOT NULL,
        "scheduledDate" date                           NOT NULL,
        "scheduledTime" character varying(10)          NOT NULL,
        "status"        "public"."appointment_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes"         text,
        "totalPrice"    numeric(10,2)                 NOT NULL DEFAULT '0',
        "totalDuration" integer                       NOT NULL DEFAULT 0,
        "createdAt"     TIMESTAMP                     NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP                     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_userId" ON "appointments" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_scheduledDate" ON "appointments" ("scheduledDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_status" ON "appointments" ("status")`);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "FK_appointments_users"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Tabela: appointment_services
    await queryRunner.query(`
      CREATE TABLE "appointment_services" (
        "id"            uuid                                    NOT NULL DEFAULT gen_random_uuid(),
        "appointmentId" uuid                                    NOT NULL,
        "serviceId"     uuid                                    NOT NULL,
        "status"        "public"."appointment_service_status_enum" NOT NULL DEFAULT 'PENDING',
        "price"         numeric(10,2)                          NOT NULL,
        CONSTRAINT "PK_appointment_services" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "appointment_services"
        ADD CONSTRAINT "FK_appointment_services_appointments"
        FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "appointment_services"
        ADD CONSTRAINT "FK_appointment_services_services"
        FOREIGN KEY ("serviceId") REFERENCES "services"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_appointment_services_services"`);
    await queryRunner.query(`ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_appointment_services_appointments"`);
    await queryRunner.query(`DROP TABLE "appointment_services"`);

    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_users"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_scheduledDate"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_userId"`);
    await queryRunner.query(`DROP TABLE "appointments"`);

    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."appointment_service_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
