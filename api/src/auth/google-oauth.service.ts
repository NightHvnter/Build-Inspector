import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { UserIdentityEntity } from '../user/identity.entity.js';
import { UserService } from '../user/user.service.js';
import { AuthService } from './auth.service.js';
import { UserLoginResDto } from '../common/dto/user.dto.js';

// The desktop app's side of the login: where to send the browser back to, and the
// PKCE challenge its one-time code must match.
export interface AppRequest {
  port: number;
  challenge: string;
  state: string;
}

interface PendingLogin extends AppRequest {
  googleVerifier: string;
  expires: number;
}

interface OneTimeCode {
  userId: number;
  challenge: string;
  expires: number;
}

export interface GoogleProfile {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const LOGIN_TTL_MS = 10 * 60 * 1000; // time to finish signing in on Google's page
const CODE_TTL_MS = 60 * 1000; // time for the app to collect its tokens
const MAX_PENDING = 1000;

const base64url = (bytes: Buffer): string => bytes.toString('base64url');
const random = (): string => base64url(randomBytes(32));
const s256 = (verifier: string): string => base64url(createHash('sha256').update(verifier).digest());

// The browser is only ever sent back to the app's own server on this computer.
export function appRedirect(app: Pick<AppRequest, 'port' | 'state'>, params: Record<string, string>): string {
  const url = new URL(`http://127.0.0.1:${app.port}/callback`);
  for (const [key, value] of Object.entries({ ...params, state: app.state })) url.searchParams.set(key, value);
  return url.href;
}

// Turns a Google display name or email into a username the API accepts (3-50 of a-z 0-9 . _ -).
export function usernameFrom(name: string | null, email: string | null): string {
  const raw = name || email?.split('@')[0] || '';
  const clean = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 40);
  return clean.length >= 3 ? clean : 'utente';
}

@Injectable()
export class GoogleOAuthService {
  private readonly pending = new Map<string, PendingLogin>();
  private readonly codes = new Map<string, OneTimeCode>();

  constructor(
    private readonly config: ConfigService,
    private readonly users: UserService,
    private readonly auth: AuthService,
    @InjectRepository(UserIdentityEntity)
    private readonly identities: Repository<UserIdentityEntity>,
  ) {}

  private settings(): { clientId: string; clientSecret: string; redirectUri: string } {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const base = this.config.get<string>('OAUTH_CALLBACK_BASE');
    if (!clientId || !clientSecret || !base)
      throw new ServiceUnavailableException('Google login is not configured');
    return { clientId, clientSecret, redirectUri: base.replace(/\/+$/, '') + '/auth/google/callback' };
  }

  private purge(): void {
    const now = Date.now();
    for (const [key, login] of this.pending) if (login.expires < now) this.pending.delete(key);
    for (const [key, code] of this.codes) if (code.expires < now) this.codes.delete(key);
  }

  // Step 1: the address of Google's sign-in page for this app request.
  start(app: AppRequest): string {
    const { clientId, redirectUri } = this.settings();
    this.purge();
    if (this.pending.size >= MAX_PENDING) throw new ServiceUnavailableException('Too many logins in progress');
    const state = random();
    const googleVerifier = random();
    this.pending.set(state, { ...app, googleVerifier, expires: Date.now() + LOGIN_TTL_MS });
    const url = new URL(GOOGLE_AUTH);
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: s256(googleVerifier),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString();
    return url.href;
  }

  // Each login can be finished once: the state is removed as soon as Google sends it back.
  takePending(state: string): PendingLogin | null {
    this.purge();
    const login = this.pending.get(state) ?? null;
    this.pending.delete(state);
    return login;
  }

  // Step 2: Google sent the browser back with a code. Returns the app's one-time code.
  async finish(login: PendingLogin, code: string): Promise<string> {
    const profile = await this.fetchProfile(code, login.googleVerifier);
    const userId = await this.userFor(profile);
    const oneTime = random();
    this.codes.set(oneTime, { userId, challenge: login.challenge, expires: Date.now() + CODE_TTL_MS });
    return oneTime;
  }

  // Step 3: the app trades its one-time code, proving it started the login, for tokens.
  async exchange(code: string, verifier: string): Promise<UserLoginResDto> {
    this.purge();
    const entry = this.codes.get(code);
    this.codes.delete(code);
    const expected = entry ? Buffer.from(entry.challenge) : null;
    const actual = Buffer.from(s256(verifier));
    if (!entry || !expected || expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new UnauthorizedException('Invalid login code');
    return this.auth.signInUser(entry.userId);
  }

  private async fetchProfile(code: string, verifier: string): Promise<GoogleProfile> {
    const { clientId, clientSecret, redirectUri } = this.settings();
    const response = await fetch(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new UnauthorizedException('Google rejected the login');
    const { id_token: idToken } = (await response.json()) as { id_token?: unknown };
    return parseIdToken(idToken, clientId);
  }

  // The Google account's user: already linked, linked now by a verified email, or new.
  private async userFor(profile: GoogleProfile): Promise<number> {
    const linked = await this.identities.findOneBy({ Provider: 'google', ProviderUserId: profile.sub });
    if (linked) return linked.UserId;
    if (!profile.email) throw new UnauthorizedException('Google gave no email');

    const existing = await this.users.findByEmail(profile.email);
    if (existing && !profile.emailVerified)
      // Linking on an unverified address would let anyone take over that account.
      throw new UnauthorizedException('Email already in use');
    const userId = existing
      ? existing.id
      : (await this.users.create({
          Username: await this.freeUsername(usernameFrom(profile.name, profile.email)),
          Email: profile.email,
          Password: null,
        })).id;
    await this.identities.save(
      this.identities.create({ UserId: userId, Provider: 'google', ProviderUserId: profile.sub }),
    );
    return userId;
  }

  private async freeUsername(base: string): Promise<string> {
    if (!(await this.users.findByUsername(base))) return base;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `${base.slice(0, 44)}-${randomBytes(2).toString('hex')}`;
      if (!(await this.users.findByUsername(candidate))) return candidate;
    }
    return `utente-${randomBytes(6).toString('hex')}`;
  }
}

// The ID token comes straight from Google's token endpoint over HTTPS, so its signature
// doesn't need checking (OpenID Connect Core 3.1.3.7); its claims still do.
export function parseIdToken(idToken: unknown, clientId: string, now = Date.now()): GoogleProfile {
  const payload = typeof idToken === 'string' ? idToken.split('.')[1] : undefined;
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(payload ?? '', 'base64url').toString('utf8'));
  } catch {
    throw new UnauthorizedException('Invalid Google token');
  }
  const aud = claims.aud;
  const valid =
    typeof claims.sub === 'string' &&
    !!claims.sub &&
    GOOGLE_ISSUERS.includes(claims.iss as string) &&
    (aud === clientId || (Array.isArray(aud) && aud.includes(clientId))) &&
    typeof claims.exp === 'number' &&
    claims.exp * 1000 > now;
  if (!valid) throw new UnauthorizedException('Invalid Google token');
  return {
    sub: claims.sub as string,
    email: typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : null,
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
    name: typeof claims.name === 'string' ? claims.name : null,
  };
}
