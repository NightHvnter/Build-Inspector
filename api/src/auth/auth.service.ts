import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions  } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { PasswordService } from './password.service.js';
import { UserLoginReqDto, UserLoginResDto } from "../common/dto/user.dto.js"
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async updateRefreshToken(id: number, hash: string | null): Promise<void> {
      await this.userRepository.update(id, { RefreshToken: hash });
  }

  async signIn(userReq: UserLoginReqDto) {
    const user = await this.userService.findByEmail(userReq.Email);
  
    const valid =!!user && (await this.passwordService.verify(userReq.Password, user.Password));
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.Id, email: user.Email };
    const [accessToken, refreshToken] = await this.passwordService.issueToken(payload);

    // Salvo solo l'hash del refresh token
    const refreshHash = await this.passwordService.hash(refreshToken);
    await this.updateRefreshToken(user.Id, refreshHash);

    return { accessToken, refreshToken };
  }

  async signOut(userId: number) {
    await this.updateRefreshToken(userId, null);
  }
}