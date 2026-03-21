import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { AppointmentServiceEntity } from './appointments/entities/appointment-service.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASS || 'postgres',
  database: process.env.DATABASE_NAME || 'leila_db',
  entities: [User, Service, Appointment, AppointmentServiceEntity],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
