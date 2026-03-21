import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { AppointmentServiceEntity } from './appointments/entities/appointment-service.entity';

const dbOptions = process.env.DATABASE_URL
  ? {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      type: 'postgres' as const,
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASS || 'postgres',
      database: process.env.DATABASE_NAME || 'leila_db',
    };

export const AppDataSource = new DataSource({
  ...dbOptions,
  entities: [User, Service, Appointment, AppointmentServiceEntity],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
