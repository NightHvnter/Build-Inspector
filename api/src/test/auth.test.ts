import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service.js';
import { AuthController } from '../auth/auth.controller.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { JwtUserPayload, UserLoginReqDto, UserLoginResDto } from '../common/dto/user.dto.js';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenDto } from '../common/dto/user.dto.js';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: vitest.fn(),
            refresh: vitest.fn(),
            signOut: vitest.fn(),
          },
        },
      ],
    })
      // The guard is covered separately; here we only test the controller.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return a UserLoginResDto on successful login', async () => {
      const dto: UserLoginReqDto = { Email: 'test@example.com', Password: 'password' };
      const resDto: UserLoginResDto = {
        id: 1,
        Username: 'test',
        Email: 'test@example.com',
        accessToken: 'token',
        refreshToken: 'refreshToken',
      };

      vitest.spyOn(authService, 'signIn').mockResolvedValue(resDto);

      const result = await authController.login(dto);
      expect(result).toEqual(resDto);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const dto: UserLoginReqDto = { Email: 'test@example.com', Password: 'wrongpassword' };

      vitest.spyOn(authService, 'signIn').mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(authController.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return a UserLoginResDto on successful refresh', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'refreshToken' };
      const resDto: UserLoginResDto = {
        id: 1,
        Username: 'test',
        Email: 'test@example.com',
        accessToken: 'token',
        refreshToken: 'refreshToken',
      };

      vitest.spyOn(authService, 'refresh').mockResolvedValue(resDto);

      const result = await authController.refresh(dto);
      expect(result).toEqual(resDto);
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'invalidToken' };

      vitest.spyOn(authService, 'refresh').mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(authController.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should call authService.signOut with the correct user ID', async () => {
      const req: JwtUserPayload = {
        sub: 1,
        Username: 'a',
        Email: 'a'
      };

      vitest.spyOn(authService, 'signOut').mockResolvedValue();

      await authController.logout({user: req});
      expect(authService.signOut).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = {
        user: undefined as unknown as JwtUserPayload,
      };

      await expect(authController.logout(req)).rejects.toThrow(UnauthorizedException);
    });
  });
});