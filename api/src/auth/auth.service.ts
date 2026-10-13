import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { PasswordService } from './password.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signUp(email: string, password: string)/*:  Promise<{accessToken: string; refreshToken: string;} | null> */ {
    if (await this.users.findByEmail(email)) {
      return null;
    }
    
  }

  async signIn(email: string, password: string) {
    
  }

  async signOut(userId: string) {
    
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    /* await this.users.update(userId, {
      refreshTokenHash: await this.passwords.hash(refreshToken),
    });*/

    return { accessToken, refreshToken };
  }
}