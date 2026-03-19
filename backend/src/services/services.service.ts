import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepository.create(dto);
    return this.servicesRepository.save(service);
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.servicesRepository.findAndCount({
      where: { isActive: true },
      select: ['id', 'name', 'description', 'price', 'durationMinutes', 'isActive', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      select: ['id', 'name', 'description', 'price', 'durationMinutes', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }
    return service;
  }

  async findByIds(ids: string[]): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { id: In(ids), isActive: true },
      select: ['id', 'name', 'price', 'durationMinutes'],
    });
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);
    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async deactivate(id: string): Promise<Service> {
    const service = await this.findById(id);
    service.isActive = false;
    return this.servicesRepository.save(service);
  }
}
