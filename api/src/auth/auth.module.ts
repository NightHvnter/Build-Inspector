import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from './password.service.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { UserService } from '../user/user.service.js';
import { UserEntity } from '../user/user.entity.js';
import { AuthController } from './auth.controller.js';
import { UserController } from '../user/user.controller.js';
import { UserIdentityEntity } from '../user/identity.entity.js';
import { GoogleOAuthService } from './google-oauth.service.js';
import { OAuthController } from './oauth.controller.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserEntity, UserIdentityEntity]), // serve a UserService per @InjectRepository
    JwtModule.register({}), // i secret li passi già in sign/verify
  ],
  providers: [PasswordService, AuthService, UserService, JwtAuthGuard, GoogleOAuthService],
  controllers: [AuthController, UserController, OAuthController],
  exports: [PasswordService, UserService, JwtAuthGuard],
})
export class AuthModule {}