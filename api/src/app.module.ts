import { CpuModule } from './cpu/cpu.module.js';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpuModule } from './gpu/gpu.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'app_user',
      password: 'app_password',
      database: 'mio_database',
      autoLoadEntities: true,
      synchronize: false,
    }), 
    CpuModule,
    GpuModule
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
