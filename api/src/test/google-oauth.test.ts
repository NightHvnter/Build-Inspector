import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  appRedirect,
  GoogleOAuthService,
  parseIdToken,
  usernameFrom,
} from '../auth/google-oauth.service.js';

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
      name: 'Mario Rossi',
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
  expect(usernameFrom('Mario Rossi', null)).toBe('Mario.Rossi');
  expect(usernameFrom('Élodie Müller-Ñ', null)).toBe('Elodie.Muller-N');
  expect(usernameFrom(null, 'giulia_99@example.com')).toBe('giulia_99');
  expect(usernameFrom('李', null)).toBe('utente');
});

it('only ever sends the browser back to the app on this computer', () => {
  expect(appRedirect(APP, { code: 'abc' })).toBe(
    `http://127.0.0.1:51234/callback?code=abc&state=${APP.state}`,
  );
});

describe('GoogleOAuthService', () => {
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
  let service: GoogleOAuthService;

  beforeEach(() => {
    users = {
      findByEmail: vitest.fn().mockResolvedValue(null),
      findByUsername: vitest.fn().mockResolvedValue(null),
      create: vitest.fn().mockResolvedValue({ id: 7 }),
    };
    identities = {
      findOneBy: vitest.fn().mockResolvedValue(null),
      create: vitest.fn((value) => value),
      save: vitest.fn(),
    };
    auth = { signInUser: vitest.fn().mockResolvedValue({ id: 7, accessToken: 'a', refreshToken: 'r' }) };
    service = new GoogleOAuthService(config as never, users as never, auth as never, identities as never);
    vitest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ id_token: idToken(CLAIMS) }), { status: 200 }));
  });
  afterEach(() => vitest.restoreAllMocks());

  // Runs steps 1 and 2, returning the one-time code the app receives.
  async function signIn(): Promise<string> {
    const google = new URL(service.start(APP));
    const login = service.takePending(google.searchParams.get('state')!);
    return service.finish(login!, 'google-code');
  }

  it("sends the browser to Google's page with PKCE and the API's callback", () => {
    const google = new URL(service.start(APP));
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
    const state = new URL(service.start(APP)).searchParams.get('state')!;
    expect(service.takePending(state)).toMatchObject({ port: APP.port });
    expect(service.takePending(state)).toBeNull();
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
    expect(auth.signInUser).toHaveBeenCalledWith(3);
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
