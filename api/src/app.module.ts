import { CpuModule } from './cpu/cpu.module.js';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpuModule } from './gpu/gpu.module.js';
import { BuildModule } from './build/build.module.js';
import { configDotenv } from "dotenv";

configDotenv()

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as any,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_USER_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: Boolean(process.env.DATABASE_AUTOLOAD_ENTITIES),
      synchronize: Boolean(process.env.DATABSE_SYNC),
    }), 
    CpuModule,
    GpuModule,
    BuildModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
