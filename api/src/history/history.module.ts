import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEntity } from './history.entity.js';
import { HistoryService } from './history.service.js';
import { HistoryController } from './history.controller.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([HistoryEntity]),
    JwtModule.register({}), // JwtAuthGuard passes the secret itself
  ],
  providers: [HistoryService, JwtAuthGuard],
  controllers: [HistoryController],
})
export class HistoryModule {}
