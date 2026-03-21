import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const base: Partial<TypeOrmModuleOptions> = {
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: true,
    synchronize: false,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...base,
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    } as TypeOrmModuleOptions;
  }

  return {
    ...base,
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASS || 'postgres',
    database: process.env.DATABASE_NAME || 'leila_db',
  } as TypeOrmModuleOptions;
};
