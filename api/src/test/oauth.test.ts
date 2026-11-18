import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  appRedirect,
  OAuthService,
  parseDiscordUser,
  parseIdToken,
  usernameFrom,
} from '../auth/oauth.service.js';

const CLIENT = 'client-id.apps.googleusercontent.com';
const VERIFIER = 'v'.repeat(43);
const CHALLENGE = createHash('sha256').update(VERIFIER).digest('base64url');
const APP = { port: 51234, challenge: CHALLENGE, state: 's'.repeat(43) };

function idToken(claims: Record<string, unknown>): string {
  const part = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part(claims)}.signature`;
}
const CLAIMS = {
  iss: 'https://accounts.google.com',
  aud: CLIENT,
  sub: '1234567890',
  email: 'Mario.Rossi@Gmail.com',
  email_verified: true,
  name: 'Mario Rossi',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

describe('parseIdToken', () => {
  it("reads the Google account's id, email and name", () => {
    expect(parseIdToken(idToken(CLAIMS), CLIENT)).toEqual({
      sub: '1234567890',
      email: 'mario.rossi@gmail.com',
      emailVerified: true,
      names: ['Mario Rossi'],
    });
  });

  it('rejects tokens for another app, from another issuer, expired or malformed', () => {
    for (const bad of [
      idToken({ ...CLAIMS, aud: 'someone-else' }),
      idToken({ ...CLAIMS, iss: 'https://evil.example' }),
      idToken({ ...CLAIMS, exp: 1 }),
      idToken({ ...CLAIMS, sub: '' }),
      'not-a-token',
      undefined,
    ])
      expect(() => parseIdToken(bad, CLIENT)).toThrow(UnauthorizedException);
  });
});

it('makes usernames the API accepts', () => {
  expect(usernameFrom(['Mario Rossi'], null)).toBe('Mario.Rossi');
  expect(usernameFrom(['Élodie Müller-Ñ'], null)).toBe('Elodie.Muller-N');
  expect(usernameFrom([], 'giulia_99@example.com')).toBe('giulia_99');
  // One separator between words, none at the ends.
  expect(usernameFrom(['Mr. BlooDyCrow'], null)).toBe('Mr.BlooDyCrow');
  expect(usernameFrom(['...a..b - c...'], null)).toBe('a.b.c');
  // Decorative and full-width letters become plain ones.
  expect(usernameFrom(['𝕭𝖑𝖔𝖔𝖉𝖞 𝕮𝖗𝖔𝖜'], null)).toBe('Bloody.Crow');
  expect(usernameFrom(['Ｂｌｏｏｄｙ'], null)).toBe('Bloody');
});

it('falls back to the next name, then the email, before "utente"', () => {
  expect(usernameFrom(['🩸🐦‍⬛', 'bloodycrow'], null)).toBe('bloodycrow');
  expect(usernameFrom(['李小龍', 'xy'], 'li.xiaolong@example.com')).toBe('li.xiaolong');
  expect(usernameFrom(['李'], null)).toBe('utente');
});

it('only ever sends the browser back to the app on this computer', () => {
  expect(appRedirect(APP, { code: 'abc' })).toBe(
    `http://127.0.0.1:51234/callback?code=abc&state=${APP.state}`,
  );
});

describe('OAuthService with Google', () => {
  const config = {
    get: (key: string) =>
      ({
        GOOGLE_CLIENT_ID: CLIENT,
        GOOGLE_CLIENT_SECRET: 'secret',
        OAUTH_CALLBACK_BASE: 'http://localhost:3636/',
      })[key],
  };
  let users: Record<string, ReturnType<typeof vitest.fn>>;
  let identities: Record<string, ReturnType<typeof vitest.fn>>;
  let auth: { signInUser: ReturnType<typeof vitest.fn> };
  let service: OAuthService;

  beforeEach(() => {
    users = {
      findByEmail: vitest.fn().mockResolvedValue(null),
      findByUsername: vitest.fn().mockResolvedValue(null),
      findById: vitest.fn().mockResolvedValue({ id: 3, Username: 'Mario.Rossi' }),
      update: vitest.fn(),
      create: vitest.fn().mockResolvedValue({ id: 7 }),
    };
    identities = {
      findOneBy: vitest.fn().mockResolvedValue(null),
      create: vitest.fn((value) => value),
      save: vitest.fn(),
    };
    auth = { signInUser: vitest.fn().mockResolvedValue({ id: 7, accessToken: 'a', refreshToken: 'r' }) };
    service = new OAuthService(config as never, users as never, auth as never, identities as never);
    vitest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ id_token: idToken(CLAIMS) }), { status: 200 }));
  });
  afterEach(() => vitest.restoreAllMocks());

  // Runs steps 1 and 2, returning the one-time code the app receives.
  async function signIn(): Promise<string> {
    const google = new URL(service.start('google', APP));
    const login = service.takePending('google', google.searchParams.get('state')!);
    return service.finish(login!, 'google-code');
  }

  it("sends the browser to Google's page with PKCE and the API's callback", () => {
    const google = new URL(service.start('google', APP));
    expect(google.origin + google.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(google.searchParams)).toMatchObject({
      client_id: CLIENT,
      redirect_uri: 'http://localhost:3636/auth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge_method: 'S256',
    });
    // Google's state is the API's own, not the app's.
    expect(google.searchParams.get('state')).not.toBe(APP.state);
  });

  it('accepts each Google return only once', () => {
    const state = new URL(service.start('google', APP)).searchParams.get('state')!;
    // A Google login can't be finished through Discord's callback.
    expect(service.takePending('discord', state)).toBeNull();
    expect(service.takePending('google', state)).toMatchObject({ port: APP.port });
    expect(service.takePending('google', state)).toBeNull();
  });

  it('creates a new user without a password and links the Google account', async () => {
    const code = await signIn();
    expect(users.create).toHaveBeenCalledWith({ Username: 'Mario.Rossi', Email: 'mario.rossi@gmail.com', Password: null });
    expect(identities.save).toHaveBeenCalledWith({ UserId: 7, Provider: 'google', ProviderUserId: '1234567890' });
    expect(await service.exchange(code, VERIFIER)).toMatchObject({ accessToken: 'a' });
    expect(auth.signInUser).toHaveBeenCalledWith(7);
  });

  it('signs in the user already linked to the Google account', async () => {
    identities.findOneBy.mockResolvedValue({ UserId: 3 });
    await service.exchange(await signIn(), VERIFIER);
    expect(users.create).not.toHaveBeenCalled();
    expect(users.update).not.toHaveBeenCalled();
    expect(auth.signInUser).toHaveBeenCalledWith(3);
  });

  it('renames a linked account still called "utente" from the fallback', async () => {
    identities.findOneBy.mockResolvedValue({ UserId: 3 });
    users.findById.mockResolvedValue({ id: 3, Username: 'utente-1a2b' });
    await signIn();
    expect(users.update).toHaveBeenCalledWith(3, { Username: 'Mario.Rossi' });
  });

  it('links an existing account by email only when Google verified it', async () => {
    users.findByEmail.mockResolvedValue({ id: 4 });
    await service.exchange(await signIn(), VERIFIER);
    expect(identities.save).toHaveBeenCalledWith(expect.objectContaining({ UserId: 4 }));

    vitest.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id_token: idToken({ ...CLAIMS, email_verified: false }) })),
    );
    identities.save.mockClear();
    await expect(signIn()).rejects.toThrow('Email already in use');
    expect(identities.save).not.toHaveBeenCalled();
  });

  it('picks a free username when the name is taken', async () => {
    users.findByUsername.mockResolvedValueOnce({ id: 1 });
    await signIn();
    expect(users.create.mock.calls[0][0].Username).toMatch(/^Mario\.Rossi-[0-9a-f]{4}$/);
  });

  it('gives tokens only for the right verifier, and only once', async () => {
    const code = await signIn();
    await expect(service.exchange(code, 'w'.repeat(43))).rejects.toThrow(UnauthorizedException);
    // A wrong try uses up the code too.
    await expect(service.exchange(code, VERIFIER)).rejects.toThrow(UnauthorizedException);
    const again = await signIn();
    await service.exchange(again, VERIFIER);
    await expect(service.exchange(again, VERIFIER)).rejects.toThrow(UnauthorizedException);
  });

  it('fails when Google refuses the code', async () => {
    vitest.mocked(fetch).mockResolvedValue(new Response('{}', { status: 400 }));
    await expect(signIn()).rejects.toThrow(UnauthorizedException);
    expect(users.create).not.toHaveBeenCalled();
  });
});

describe('parseDiscordUser', () => {
  it("reads the Discord account's id, email, verification and display name", () => {
    expect(
      parseDiscordUser({ id: '80351110224678912', username: 'nelly', global_name: 'Nelly', email: 'Nelly@Discord.com', verified: true }),
    ).toEqual({ sub: '80351110224678912', email: 'nelly@discord.com', emailVerified: true, names: ['Nelly', 'nelly'] });
    expect(parseDiscordUser({ id: '1', username: 'nelly', global_name: null, email: null, verified: false })).toEqual({
      sub: '1',
      email: null,
      emailVerified: false,
      names: ['nelly'],
    });
  });

  it('rejects an answer without a valid id', () => {
    for (const bad of [{}, { id: 42 }, { id: 'abc' }, null]) expect(() => parseDiscordUser(bad)).toThrow(UnauthorizedException);
  });
});

describe('OAuthService with Discord', () => {
  const config = {
    get: (key: string) =>
      ({ DISCORD_CLIENT_ID: '123456789012345678', DISCORD_CLIENT_SECRET: 'secret', OAUTH_CALLBACK_BASE: 'http://localhost:3636' })[key],
  };
  const DISCORD_USER = { id: '80351110224678912', username: 'nelly', global_name: 'Nelly', email: 'nelly@discord.com', verified: false };
  let users: Record<string, ReturnType<typeof vitest.fn>>;
  let identities: Record<string, ReturnType<typeof vitest.fn>>;
  let calls: { url: string; init?: RequestInit }[];
  let service: OAuthService;

  beforeEach(() => {
    users = {
      findByEmail: vitest.fn().mockResolvedValue(null),
      findByUsername: vitest.fn().mockResolvedValue(null),
      create: vitest.fn().mockResolvedValue({ id: 8 }),
    };
    identities = { findOneBy: vitest.fn().mockResolvedValue(null), create: vitest.fn((v) => v), save: vitest.fn() };
    const auth = { signInUser: vitest.fn().mockResolvedValue({ id: 8, accessToken: 'a', refreshToken: 'r' }) };
    service = new OAuthService(config as never, users as never, auth as never, identities as never);
    calls = [];
    vitest.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push({ url: String(url), init });
      return String(url).endsWith('/oauth2/token')
        ? new Response(JSON.stringify({ access_token: 'discord-access', token_type: 'Bearer' }))
        : new Response(JSON.stringify(DISCORD_USER));
    });
  });
  afterEach(() => vitest.restoreAllMocks());

  it("sends the browser to Discord's page with PKCE and the API's callback", () => {
    const discord = new URL(service.start('discord', APP));
    expect(discord.origin + discord.pathname).toBe('https://discord.com/oauth2/authorize');
    expect(Object.fromEntries(discord.searchParams)).toMatchObject({
      client_id: '123456789012345678',
      redirect_uri: 'http://localhost:3636/auth/discord/callback',
      response_type: 'code',
      scope: 'identify email',
      code_challenge_method: 'S256',
    });
  });

  it("uses Discord's account name when the display name has no usable letters", async () => {
    vitest.mocked(fetch).mockImplementation(async (url) =>
      String(url).endsWith('/oauth2/token')
        ? new Response(JSON.stringify({ access_token: 'discord-access' }))
        : new Response(JSON.stringify({ ...DISCORD_USER, global_name: '🩸🐦‍⬛' })),
    );
    const state = new URL(service.start('discord', APP)).searchParams.get('state')!;
    await service.finish(service.takePending('discord', state)!, 'discord-code');
    expect(users.create.mock.calls[0][0].Username).toBe('nelly');
  });

  it('reads the account with the access token and creates the user', async () => {
    const state = new URL(service.start('discord', APP)).searchParams.get('state')!;
    const code = await service.finish(service.takePending('discord', state)!, 'discord-code');
    expect(calls.map((c) => c.url)).toEqual(['https://discord.com/api/oauth2/token', 'https://discord.com/api/users/@me']);
    expect(new URLSearchParams(String(calls[0].init?.body)).get('redirect_uri')).toBe('http://localhost:3636/auth/discord/callback');
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe('Bearer discord-access');
    expect(users.create).toHaveBeenCalledWith({ Username: 'Nelly', Email: 'nelly@discord.com', Password: null });
    expect(identities.save).toHaveBeenCalledWith({ UserId: 8, Provider: 'discord', ProviderUserId: '80351110224678912' });
    expect(await service.exchange(code, VERIFIER)).toMatchObject({ accessToken: 'a' });
  });

  it("won't link an existing account to a Discord email Discord hasn't verified", async () => {
    users.findByEmail.mockResolvedValue({ id: 2 });
    const state = new URL(service.start('discord', APP)).searchParams.get('state')!;
    await expect(service.finish(service.takePending('discord', state)!, 'discord-code')).rejects.toThrow('Email already in use');
    expect(identities.save).not.toHaveBeenCalled();
  });

  it('is unavailable until its keys are in .env', () => {
    const empty = new OAuthService({ get: () => undefined } as never, users as never, {} as never, identities as never);
    expect(() => empty.start('discord', APP)).toThrow('discord login is not configured');
  });
});
