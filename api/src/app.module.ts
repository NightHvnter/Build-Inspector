import { CpuModule } from './cpu/cpu.module.js';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpuModule } from './gpu/gpu.module.js';
import { BuildModule } from './build/build.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SteamModule } from './steam/steam.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: "../.env"}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<"mariadb">("DATABASE_TYPE"),
        host: configService.get<string>("DATABASE_HOST"),
        port: configService.get<number>("DATABASE_PORT"),
        username: configService.get<string>("DATABASE_USER"),
        password: configService.get<string>("DATABASE_USER_PASSWORD"),
        database: configService.get<string>("DATABASE_NAME"),
        autoLoadEntities: configService.get<boolean>("DATABASE_AUTOLOAD_ENTITIES"),
        synchronize: configService.get<boolean>("DATABSE_SYNC"),
        logging: configService.get<boolean>("DATABSE_LOGGING")
      })
    }), 
    CpuModule,
    GpuModule,
    BuildModule,
    SteamModule
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
