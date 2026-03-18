import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity.js';
import { Service } from '../services/entities/service.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASS || 'postgres',
  database: process.env.DATABASE_NAME || 'leila_db',
  entities: [User, Service],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const userRepository = dataSource.getRepository(User);
  const serviceRepository = dataSource.getRepository(Service);

  // Create admin user
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@leila.com' },
  });

  if (!existingAdmin) {
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const admin = userRepository.create({
      name: 'Administrador',
      email: 'admin@leila.com',
      phone: '11999999999',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    });
    await userRepository.save(admin);
    console.log('Admin user created: admin@leila.com / Admin@123');
  } else {
    console.log('Admin user already exists');
  }

  // Create test client
  const existingClient = await userRepository.findOne({
    where: { email: 'cliente@teste.com' },
  });

  if (!existingClient) {
    const clientHash = await bcrypt.hash('Cliente@123', 10);
    const client = userRepository.create({
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: '11988888888',
      passwordHash: clientHash,
      role: UserRole.CLIENT,
    });
    await userRepository.save(client);
    console.log('Test client created: cliente@teste.com / Cliente@123');
  } else {
    console.log('Test client already exists');
  }

  // Create services
  const services = [
    {
      name: 'Corte Feminino',
      description: 'Corte feminino com lavagem e finalização',
      price: 80.0,
      durationMinutes: 60,
    },
    {
      name: 'Corte Masculino',
      description: 'Corte masculino com lavagem',
      price: 40.0,
      durationMinutes: 30,
    },
    {
      name: 'Escova Progressiva',
      description: 'Escova progressiva completa',
      price: 250.0,
      durationMinutes: 180,
    },
    {
      name: 'Coloração',
      description: 'Coloração completa com produtos de qualidade',
      price: 150.0,
      durationMinutes: 120,
    },
    {
      name: 'Manicure',
      description: 'Manicure completa com esmaltação',
      price: 35.0,
      durationMinutes: 45,
    },
    {
      name: 'Pedicure',
      description: 'Pedicure completa com esmaltação',
      price: 40.0,
      durationMinutes: 50,
    },
    {
      name: 'Sobrancelha',
      description: 'Design de sobrancelha',
      price: 25.0,
      durationMinutes: 20,
    },
    {
      name: 'Hidratação Capilar',
      description: 'Hidratação profunda para cabelos',
      price: 90.0,
      durationMinutes: 60,
    },
  ];

  for (const serviceData of services) {
    const existing = await serviceRepository.findOne({
      where: { name: serviceData.name },
    });

    if (!existing) {
      const service = serviceRepository.create(serviceData);
      await serviceRepository.save(service);
      console.log(`Service created: ${serviceData.name}`);
    } else {
      console.log(`Service already exists: ${serviceData.name}`);
    }
  }

  console.log('Seed completed successfully!');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
