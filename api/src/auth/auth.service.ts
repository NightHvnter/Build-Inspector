import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { PasswordService } from './password.service.js';
import { JwtUserPayload, UserLoginReqDto, UserLoginResDto } from '../common/dto/user.dto.js';

type Expires = JwtSignOptions['expiresIn'];

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(userReq: UserLoginReqDto): Promise<UserLoginResDto> {
    const user = await this.userService.findByEmail(userReq.Email);

    // A Google-only account has no password, so a password login never matches it.
    const valid =
      !!user?.Password && (await this.passwordService.verify(userReq.Password, user.Password));
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async signOut(userId: number): Promise<void> {
    await this.userService.updateRefreshToken(userId, null);
  }

  async refresh(refreshToken: string): Promise<UserLoginResDto> {
    let payload: JwtUserPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtUserPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user?.RefreshToken) throw new UnauthorizedException('Invalid refresh token');

    const match = await this.passwordService.verify(refreshToken, user.RefreshToken);
    if (!match) throw new UnauthorizedException('Invalid refresh token');

    return this.issueTokens(user);
  }

  // Signs in a user whose identity was already checked elsewhere (Google or Discord login).
  async signInUser(userId: number): Promise<UserLoginResDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user);
  }

  private async issueTokens(user: {
    id: number;
    Username: string;
    Email: string;
  }): Promise<UserLoginResDto> {
    // Payload a mano: nel JWT non finiscono Password o RefreshToken
    const payload = { sub: user.id, Username: user.Username, Email: user.Email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES', '15m') as Expires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES', '7d') as Expires,
      }),
    ]);

    const refreshHash = await this.passwordService.hash(refreshToken);
    await this.userService.updateRefreshToken(user.id, refreshHash);

    return {
      id: user.id,
      Username: user.Username,
      Email: user.Email,
      accessToken,
      refreshToken,
    };
  }
}