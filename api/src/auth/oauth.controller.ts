import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { IsString, Matches } from 'class-validator';
import { appRedirect, GoogleOAuthService } from './google-oauth.service.js';
import { UserLoginResDto } from '../common/dto/user.dto.js';

const TOKEN = /^[A-Za-z0-9_-]{43,128}$/;

export class OAuthExchangeDto {
  @IsString()
  @Matches(TOKEN)
  code: string;

  // The PKCE secret the app kept while the browser was on Google's page.
  @IsString()
  @Matches(TOKEN)
  verifier: string;
}

// Shown in the browser when it can't be sent back to the app (unknown or expired login).
const FAILED_PAGE = `<!doctype html><meta charset="utf-8"><title>Build Inspector</title>
<body style="font-family:system-ui;margin:3rem"><h1>Accesso non riuscito</h1>
<p>La richiesta è scaduta o non è valida. Torna all'app e riprova.</p></body>`;

// Google sign-in for the desktop app:
// 1. GET  /auth/google/start    the app opens this in the browser; redirects to Google
// 2. GET  /auth/google/callback Google returns here; redirects to the app on 127.0.0.1
// 3. POST /auth/oauth/exchange  the app trades its one-time code for the usual tokens
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly google: GoogleOAuthService) {}

  @Get('google/start')
  start(
    @Query('port') port: string,
    @Query('challenge') challenge: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): void {
    const portNumber = Number(port);
    if (
      !/^\d{4,5}$/.test(port ?? '') ||
      portNumber < 1024 ||
      portNumber > 65535 ||
      !TOKEN.test(challenge ?? '') ||
      !TOKEN.test(state ?? '')
    )
      throw new BadRequestException('Invalid login request');
    res.redirect(HttpStatus.FOUND, this.google.start({ port: portNumber, challenge, state }));
  }

  @Get('google/callback')
  async callback(
    @Query('state') state: string,
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const login = typeof state === 'string' ? this.google.takePending(state) : null;
    if (!login) {
      res.status(HttpStatus.BAD_REQUEST).type('html').send(FAILED_PAGE);
      return;
    }
    if (error || typeof code !== 'string' || !code) {
      res.redirect(HttpStatus.FOUND, appRedirect(login, { error: error === 'access_denied' ? 'denied' : 'failed' }));
      return;
    }
    try {
      const oneTime = await this.google.finish(login, code);
      res.redirect(HttpStatus.FOUND, appRedirect(login, { code: oneTime }));
    } catch (err) {
      const reason = err instanceof Error && err.message === 'Email already in use' ? 'email_taken' : 'failed';
      this.logger.warn(`Google login failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      res.redirect(HttpStatus.FOUND, appRedirect(login, { error: reason }));
    }
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  exchange(@Body() dto: OAuthExchangeDto): Promise<UserLoginResDto> {
    return this.google.exchange(dto.code, dto.verifier);
  }
}
