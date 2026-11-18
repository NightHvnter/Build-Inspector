import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { UserIdentityEntity } from '../user/identity.entity.js';
import { UserService } from '../user/user.service.js';
import { AuthService } from './auth.service.js';
import { UserLoginResDto } from '../common/dto/user.dto.js';

export const PROVIDERS = ['google', 'discord'] as const;
export type Provider = (typeof PROVIDERS)[number];

export function isProvider(value: unknown): value is Provider {
  return PROVIDERS.includes(value as Provider);
}

// The desktop app's side of the login: where to send the browser back to, and the
// PKCE challenge its one-time code must match.
export interface AppRequest {
  port: number;
  challenge: string;
  state: string;
}

interface PendingLogin extends AppRequest {
  provider: Provider;
  providerVerifier: string;
  expires: number;
}

interface OneTimeCode {
  userId: number;
  challenge: string;
  expires: number;
}

// The account as the provider describes it.
export interface ExternalProfile {
  sub: string; // the provider's stable id for the account
  email: string | null;
  emailVerified: boolean;
  // Names to build the username from, best first (e.g. Discord's display name, then account name).
  names: string[];
}

interface ProviderSettings {
  authUrl: string;
  tokenUrl: string;
  scope: string;
  extraAuthParams: Record<string, string>;
  clientIdKey: string;
  clientSecretKey: string;
  // Reads the account from the token endpoint's answer.
  profile: (tokens: Record<string, unknown>, clientId: string) => Promise<ExternalProfile>;
}

const LOGIN_TTL_MS = 10 * 60 * 1000; // time to finish signing in on the provider's page
const CODE_TTL_MS = 60 * 1000; // time for the app to collect its tokens
const MAX_PENDING = 1000;

const random = (): string => randomBytes(32).toString('base64url');
const s256 = (verifier: string): string => createHash('sha256').update(verifier).digest('base64url');

const SETTINGS: Record<Provider, ProviderSettings> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    extraAuthParams: { prompt: 'select_account' },
    clientIdKey: 'GOOGLE_CLIENT_ID',
    clientSecretKey: 'GOOGLE_CLIENT_SECRET',
    profile: async (tokens, clientId) => parseIdToken(tokens.id_token, clientId),
  },
  discord: {
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scope: 'identify email',
    extraAuthParams: {},
    clientIdKey: 'DISCORD_CLIENT_ID',
    clientSecretKey: 'DISCORD_CLIENT_SECRET',
    profile: async (tokens) => {
      if (typeof tokens.access_token !== 'string') throw new UnauthorizedException('Invalid Discord token');
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: 'Bearer ' + tokens.access_token },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new UnauthorizedException('Discord rejected the login');
      return parseDiscordUser(await response.json());
    },
  },
};

// The browser is only ever sent back to the app's own server on this computer.
export function appRedirect(app: Pick<AppRequest, 'port' | 'state'>, params: Record<string, string>): string {
  const url = new URL(`http://127.0.0.1:${app.port}/callback`);
  for (const [key, value] of Object.entries({ ...params, state: app.state })) url.searchParams.set(key, value);
  return url.href;
}

// One name as a username the API accepts (3-50 of a-z 0-9 . _ -), or null if too little is left.
function asUsername(raw: string): string | null {
  const clean = raw
    // Compatibility forms first: decorative letters like "𝕭𝖑𝖔𝖔𝖉𝖞" or "Ｂｌｏｏｄｙ" become "Bloody".
    .normalize('NFKC')
    // Then split accents off ("Élodie" → "E" + accent) and drop them.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    // "Mr. Bloody" → "Mr..Bloody" → "Mr.Bloody"; no separators at the ends.
    .replace(/[._-]*\.[._-]*/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 40)
    .replace(/[._-]+$/, '');
  return clean.length >= 3 ? clean : null;
}

// The first of the names (then the email's local part) that makes a valid username.
export function usernameFrom(names: (string | null | undefined)[], email: string | null): string {
  for (const name of [...names, email?.split('@')[0]]) {
    const username = name ? asUsername(name) : null;
    if (username) return username;
  }
  return 'utente';
}

@Injectable()
export class OAuthService {
  private readonly pending = new Map<string, PendingLogin>();
  private readonly codes = new Map<string, OneTimeCode>();

  constructor(
    private readonly config: ConfigService,
    private readonly users: UserService,
    private readonly auth: AuthService,
    @InjectRepository(UserIdentityEntity)
    private readonly identities: Repository<UserIdentityEntity>,
  ) {}

  private settings(provider: Provider): ProviderSettings & {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } {
    const settings = SETTINGS[provider];
    const clientId = this.config.get<string>(settings.clientIdKey);
    const clientSecret = this.config.get<string>(settings.clientSecretKey);
    const base = this.config.get<string>('OAUTH_CALLBACK_BASE');
    if (!clientId || !clientSecret || !base)
      throw new ServiceUnavailableException(`${provider} login is not configured`);
    return {
      ...settings,
      clientId,
      clientSecret,
      redirectUri: `${base.replace(/\/+$/, '')}/auth/${provider}/callback`,
    };
  }

  private purge(): void {
    const now = Date.now();
    for (const [key, login] of this.pending) if (login.expires < now) this.pending.delete(key);
    for (const [key, code] of this.codes) if (code.expires < now) this.codes.delete(key);
  }

  // Step 1: the address of the provider's sign-in page for this app request.
  start(provider: Provider, app: AppRequest): string {
    const settings = this.settings(provider);
    this.purge();
    if (this.pending.size >= MAX_PENDING) throw new ServiceUnavailableException('Too many logins in progress');
    const state = random();
    const providerVerifier = random();
    this.pending.set(state, { ...app, provider, providerVerifier, expires: Date.now() + LOGIN_TTL_MS });
    const url = new URL(settings.authUrl);
    url.search = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: settings.redirectUri,
      response_type: 'code',
      scope: settings.scope,
      state,
      code_challenge: s256(providerVerifier),
      code_challenge_method: 'S256',
      ...settings.extraAuthParams,
    }).toString();
    return url.href;
  }

  // Each login can be finished once, and only by the provider it was started with.
  takePending(provider: Provider, state: string): PendingLogin | null {
    this.purge();
    const login = this.pending.get(state) ?? null;
    if (login?.provider !== provider) return null;
    this.pending.delete(state);
    return login;
  }

  // Step 2: the provider sent the browser back with a code. Returns the app's one-time code.
  async finish(login: PendingLogin, code: string): Promise<string> {
    const profile = await this.fetchProfile(login.provider, code, login.providerVerifier);
    const userId = await this.userFor(login.provider, profile);
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

  private async fetchProfile(provider: Provider, code: string, verifier: string): Promise<ExternalProfile> {
    const settings = this.settings(provider);
    const response = await fetch(settings.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        code,
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        redirect_uri: settings.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new UnauthorizedException(`${provider} rejected the login`);
    return settings.profile((await response.json()) as Record<string, unknown>, settings.clientId);
  }

  // The external account's user: already linked, linked now by a verified email, or new.
  private async userFor(provider: Provider, profile: ExternalProfile): Promise<number> {
    const linked = await this.identities.findOneBy({ Provider: provider, ProviderUserId: profile.sub });
    if (linked) {
      await this.renameFallback(linked.UserId, profile);
      return linked.UserId;
    }
    if (!profile.email) throw new UnauthorizedException('No email from the provider');

    const existing = await this.users.findByEmail(profile.email);
    if (existing && !profile.emailVerified)
      // Linking on an unverified address would let anyone take over that account.
      throw new UnauthorizedException('Email already in use');
    const userId = existing
      ? existing.id
      : (await this.users.create({
          Username: await this.freeUsername(usernameFrom(profile.names, profile.email)),
          Email: profile.email,
          Password: null,
        })).id;
    await this.identities.save(
      this.identities.create({ UserId: userId, Provider: provider, ProviderUserId: profile.sub }),
    );
    return userId;
  }

  // Accounts named "utente" (or "utente-…") got that name because nothing better could be
  // made from their provider names: try again with the current rules at each sign-in.
  private async renameFallback(userId: number, profile: ExternalProfile): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !/^utente(-[0-9a-f]+)?$/.test(user.Username)) return;
    const better = usernameFrom(profile.names, profile.email);
    if (better === 'utente') return;
    await this.users.update(userId, { Username: await this.freeUsername(better) });
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

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

// The ID token comes straight from Google's token endpoint over HTTPS, so its signature
// doesn't need checking (OpenID Connect Core 3.1.3.7); its claims still do.
export function parseIdToken(idToken: unknown, clientId: string, now = Date.now()): ExternalProfile {
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
    names: [claims.name, claims.given_name].filter((n): n is string => typeof n === 'string'),
  };
}

// GET https://discord.com/api/users/@me with the "identify email" scopes.
export function parseDiscordUser(user: unknown): ExternalProfile {
  const u = (typeof user === 'object' && user !== null ? user : {}) as Record<string, unknown>;
  if (typeof u.id !== 'string' || !/^\d{1,20}$/.test(u.id))
    throw new UnauthorizedException('Invalid Discord account');
  const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
  return {
    sub: u.id,
    email: text(u.email)?.toLowerCase() ?? null,
    emailVerified: u.verified === true,
    // The display name if set, then the account name (always plain a-z 0-9 . _).
    names: [text(u.global_name), text(u.username)].filter((n): n is string => n !== null),
  };
}
