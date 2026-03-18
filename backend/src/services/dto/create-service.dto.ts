import { IsNotEmpty, IsString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte Feminino' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Corte feminino com lavagem e finalização' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 80.0 })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiProperty({ example: 60 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationMinutes!: number;
}
