import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';

const mockService: Service = {
  id: 'svc-uuid',
  name: 'Corte Feminino',
  description: 'Corte personalizado',
  price: 80 as any,
  durationMinutes: 60,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  find: jest.fn(),
});

describe('ServicesService', () => {
  let service: ServicesService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Service), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(ServicesService);
    repo = module.get(getRepositoryToken(Service));
  });

  describe('create', () => {
    it('creates and returns a service', async () => {
      repo.create.mockReturnValue(mockService);
      repo.save.mockResolvedValue(mockService);

      const dto = { name: 'Corte Feminino', description: 'Desc', price: 80, durationMinutes: 60 };
      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockService);
    });
  });

  describe('findAll', () => {
    it('returns paginated active services', async () => {
      repo.findAndCount.mockResolvedValue([[mockService], 1]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.lastPage).toBe(1);
    });
  });

  describe('findById', () => {
    it('returns service when found', async () => {
      repo.findOne.mockResolvedValue(mockService);

      const result = await service.findById('svc-uuid');
      expect(result).toBe(mockService);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies changes and saves', async () => {
      const updated = { ...mockService, name: 'Novo Nome' };
      repo.findOne.mockResolvedValue({ ...mockService });
      repo.save.mockResolvedValue(updated);

      const result = await service.update('svc-uuid', { name: 'Novo Nome' });
      expect(result.name).toBe('Novo Nome');
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false', async () => {
      repo.findOne.mockResolvedValue({ ...mockService });
      repo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.deactivate('svc-uuid');
      expect(result.isActive).toBe(false);
    });
  });
});
