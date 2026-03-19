import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

jest.mock('bcrypt');
const bcryptCompare = bcrypt.compare as jest.Mock;
const bcryptHash = bcrypt.hash as jest.Mock;

const mockUser = {
  id: 'user-uuid',
  name: 'Ana Lima',
  email: 'ana@test.com',
  phone: '11999999999',
  passwordHash: 'hashed',
  role: UserRole.CLIENT,
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('jwt-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.validateUser('ana@test.com', 'senha123');
      expect(result).toBe(mockUser);
    });

    it('returns null when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(false);

      const result = await service.validateUser('ana@test.com', 'errada');
      expect(result).toBeNull();
    });

    it('returns null when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('naoexiste@test.com', 'senha');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns token and user on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.login('ana@test.com', 'senha123');

      expect(result.access_token).toBe('jwt-token');
      expect(result.user.email).toBe('ana@test.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('nao@existe.com', 'senha')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('creates user and returns token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('hashed-new');
      usersService.create.mockResolvedValue(mockUser as any);

      const result = await service.register({
        name: 'Ana Lima',
        email: 'ana@test.com',
        phone: '11999999999',
        password: 'senha123',
      });

      expect(result.access_token).toBe('jwt-token');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@test.com', passwordHash: 'hashed-new' }),
      );
    });

    it('throws ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        service.register({ name: 'X', email: 'ana@test.com', phone: '11999', password: 'senha' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('returns profile for existing user', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await service.getProfile(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.getProfile('bad-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
