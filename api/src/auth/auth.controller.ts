import { Body, Controller, HttpCode, HttpStatus, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { JwtUserPayload, UserLoginReqDto, UserLoginResDto } from '../common/dto/user.dto.js';
import { RefreshTokenDto } from '../common/dto/user.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Pubblico
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: UserLoginReqDto): Promise<UserLoginResDto> {
    return this.authService.signIn(dto);
  }

  // Pubblico: viene chiamato quando l'access token è scaduto
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<UserLoginResDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  // Protetto: serve un access token valido
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: { user: JwtUserPayload }): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    return this.authService.signOut(req.user.sub);
  }
}