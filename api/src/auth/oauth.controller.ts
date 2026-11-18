import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { IsString, Matches } from 'class-validator';
import { appRedirect, isProvider, OAuthService, type Provider } from './oauth.service.js';
import { UserLoginResDto } from '../common/dto/user.dto.js';

const TOKEN = /^[A-Za-z0-9_-]{43,128}$/;

export class OAuthExchangeDto {
  @IsString()
  @Matches(TOKEN)
  code: string;

  // The PKCE secret the app kept while the browser was on the provider's page.
  @IsString()
  @Matches(TOKEN)
  verifier: string;
}

// Shown in the browser when it can't be sent back to the app (unknown or expired login).
const FAILED_PAGE = `<!doctype html><meta charset="utf-8"><title>Build Inspector</title>
<body style="font-family:system-ui;margin:3rem"><h1>Accesso non riuscito</h1>
<p>La richiesta è scaduta o non è valida. Torna all'app e riprova.</p></body>`;

function provider(value: string): Provider {
  if (!isProvider(value)) throw new NotFoundException();
  return value;
}

// Google, Discord and Steam sign-in for the desktop app:
// 1. GET  /auth/:provider/start    the app opens this in the browser; redirects to the provider
// 2. GET  /auth/:provider/callback the provider returns here; redirects to the app on 127.0.0.1
// 3. POST /auth/oauth/exchange     the app trades its one-time code for the usual tokens
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly oauth: OAuthService) {}

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  exchange(@Body() dto: OAuthExchangeDto): Promise<UserLoginResDto> {
    return this.oauth.exchange(dto.code, dto.verifier);
  }

  @Get(':provider/start')
  start(
    @Param('provider') name: string,
    @Query('port') port: string,
    @Query('challenge') challenge: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): void {
    const which = provider(name);
    const portNumber = Number(port);
    if (
      !/^\d{4,5}$/.test(port ?? '') ||
      portNumber < 1024 ||
      portNumber > 65535 ||
      !TOKEN.test(challenge ?? '') ||
      !TOKEN.test(state ?? '')
    )
      throw new BadRequestException('Invalid login request');
    res.redirect(HttpStatus.FOUND, this.oauth.start(which, { port: portNumber, challenge, state }));
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') name: string,
    @Query('state') state: string,
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    const which = provider(name);
    const login = typeof state === 'string' ? this.oauth.takePending(which, state) : null;
    if (!login) {
      res.status(HttpStatus.BAD_REQUEST).type('html').send(FAILED_PAGE);
      return;
    }
    // Steam answers with OpenID fields instead of a code; a cancel is openid.mode=cancel.
    const steam = which === 'steam';
    const denied = steam ? query['openid.mode'] === 'cancel' : error === 'access_denied';
    if (denied || (!steam && (error || typeof code !== 'string' || !code))) {
      res.redirect(HttpStatus.FOUND, appRedirect(login, { error: denied ? 'denied' : 'failed' }));
      return;
    }
    try {
      const oneTime = steam
        ? await this.oauth.finishSteam(login, query)
        : await this.oauth.finish(login, code as string);
      res.redirect(HttpStatus.FOUND, appRedirect(login, { code: oneTime }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      const reason = message === 'Email already in use' ? 'email_taken' : 'failed';
      this.logger.warn(`${which} login failed: ${message}`);
      res.redirect(HttpStatus.FOUND, appRedirect(login, { error: reason }));
    }
  }
}
