import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteEntity } from './favorite.entity.js';
import { FavoritesService } from './favorites.service.js';
import { FavoritesController } from './favorites.controller.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([FavoriteEntity]),
    JwtModule.register({}), // JwtAuthGuard passes the secret itself
  ],
  providers: [FavoritesService, JwtAuthGuard],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
