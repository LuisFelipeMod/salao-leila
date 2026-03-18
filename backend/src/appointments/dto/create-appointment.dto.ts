import { IsNotEmpty, IsString, IsArray, IsUUID, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2025-06-15' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduledDate must be in YYYY-MM-DD format' })
  scheduledDate!: string;

  @ApiProperty({ example: '14:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduledTime must be in HH:mm format' })
  scheduledTime!: string;

  @ApiProperty({ example: ['uuid1', 'uuid2'], type: [String] })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds!: string[];

  @ApiPropertyOptional({ example: 'Quero corte mais curto' })
  @IsOptional()
  @IsString()
  notes?: string;
}
