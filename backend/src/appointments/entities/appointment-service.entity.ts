import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Service } from '../../services/entities/service.entity';

export enum AppointmentServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity('appointment_services')
export class AppointmentServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appointmentId!: string;

  @Column({ type: 'uuid' })
  serviceId!: string;

  @Column({
    type: 'enum',
    enum: AppointmentServiceStatus,
    default: AppointmentServiceStatus.PENDING,
  })
  status!: AppointmentServiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @ManyToOne(() => Appointment, (appointment) => appointment.appointmentServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service!: Service;
}
