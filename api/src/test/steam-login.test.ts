import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  OAuthService,
  parseSteamProfileName,
  STEAM_LOGIN,
  steamLoginUrl,
  verifySteamLogin,
} from '../auth/oauth.service.js';

const STEAM_ID = '76561197960287930';
const RETURN_TO = 'http://localhost:3636/auth/steam/callback?state=abc';

// What Steam sends back to the callback after a successful login (shape from Steam's OpenID provider).
function steamAnswer(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    state: 'abc',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'id_res',
    'openid.op_endpoint': STEAM_LOGIN,
    'openid.claimed_id': `https://steamcommunity.com/openid/id/${STEAM_ID}`,
    'openid.identity': `https://steamcommunity.com/openid/id/${STEAM_ID}`,
    'openid.return_to': RETURN_TO,
    'openid.response_nonce': '2026-11-18T14:00:00ZaBcDeF',
    'openid.assoc_handle': '1234567890',
    'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    'openid.sig': 'c2lnbmF0dXJl',
    ...overrides,
  };
}

let checks: URLSearchParams[];
function steamSays(valid: boolean): void {
  vitest.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    if (String(url) === STEAM_LOGIN) {
      checks.push(new URLSearchParams(String(init?.body)));
      return new Response(`ns:http://specs.openid.net/auth/2.0\nis_valid:${valid}\n`);
    }
    return new Response('<profile><steamID><![CDATA[ Gabe Newell ]]></steamID></profile>');
  });
}

beforeEach(() => (checks = []));
afterEach(() => vitest.restoreAllMocks());

it("sends the browser to Steam's OpenID page, returning to the API with its state", () => {
  const url = new URL(steamLoginUrl(RETURN_TO));
  expect(url.origin + url.pathname).toBe(STEAM_LOGIN);
  expect(Object.fromEntries(url.searchParams)).toEqual({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': RETURN_TO,
    'openid.realm': 'http://localhost:3636',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
});

describe('verifySteamLogin', () => {
  it("returns the SteamID once Steam confirms its own answer", async () => {
    steamSays(true);
    expect(await verifySteamLogin(steamAnswer(), RETURN_TO)).toBe(STEAM_ID);
    // Steam gets back exactly its fields, with only the mode changed (and not our state).
    expect(checks[0].get('openid.mode')).toBe('check_authentication');
    expect(checks[0].get('openid.sig')).toBe('c2lnbmF0dXJl');
    expect(checks[0].has('state')).toBe(false);
  });

  it('refuses an answer Steam does not confirm', async () => {
    steamSays(false);
    await expect(verifySteamLogin(steamAnswer(), RETURN_TO)).rejects.toThrow(UnauthorizedException);
  });

  it('refuses answers meant for someone else, or not from Steam, without asking Steam', async () => {
    steamSays(true);
    const forgeries: Record<string, string>[] = [
      { 'openid.return_to': 'http://evil.example/auth/steam/callback?state=abc' },
      { 'openid.op_endpoint': 'https://evil.example/openid/login' },
      { 'openid.claimed_id': 'https://evil.example/openid/id/76561197960287930' },
      { 'openid.identity': 'https://steamcommunity.com/openid/id/76561197960287931' },
      { 'openid.signed': 'op_endpoint,claimed_id,identity' }, // return_to not signed
      { 'openid.mode': 'setup_needed' },
      { 'openid.sig': '' },
    ];
    for (const forged of forgeries)
      await expect(verifySteamLogin(steamAnswer(forged), RETURN_TO)).rejects.toThrow(UnauthorizedException);
    expect(checks).toEqual([]);
  });

  it('reports a cancelled login', async () => {
    await expect(verifySteamLogin({ 'openid.mode': 'cancel' }, RETURN_TO)).rejects.toThrow('cancelled');
  });
});

it("reads the display name from the public profile", () => {
  expect(parseSteamProfileName('<steamID><![CDATA[ Gabe Newell ]]></steamID>')).toEqual(['Gabe Newell']);
  expect(parseSteamProfileName('<error>The specified profile could not be found.</error>')).toEqual([]);
});

describe('OAuthService with Steam', () => {
  const VERIFIER = 'v'.repeat(43);
  const APP = {
    port: 51234,
    challenge: createHash('sha256').update(VERIFIER).digest('base64url'),
    state: 's'.repeat(43),
  };
  let users: Record<string, ReturnType<typeof vitest.fn>>;
  let identities: Record<string, ReturnType<typeof vitest.fn>>;
  let service: OAuthService;

  beforeEach(() => {
    users = {
      findByEmail: vitest.fn(),
      findByUsername: vitest.fn().mockResolvedValue(null),
      create: vitest.fn().mockResolvedValue({ id: 9 }),
    };
    identities = { findOneBy: vitest.fn().mockResolvedValue(null), create: vitest.fn((v) => v), save: vitest.fn() };
    const auth = { signInUser: vitest.fn().mockResolvedValue({ id: 9, accessToken: 'a', refreshToken: 'r' }) };
    // Steam needs no keys: only the API's own address.
    const config = { get: (key: string) => (key === 'OAUTH_CALLBACK_BASE' ? 'http://localhost:3636' : undefined) };
    service = new OAuthService(config as never, users as never, auth as never, identities as never);
  });

  // Starts a login and plays Steam's side, returning the answer for that login.
  function startLogin(): { state: string; answer: Record<string, string> } {
    const steam = new URL(service.start('steam', APP));
    const returnTo = steam.searchParams.get('openid.return_to')!;
    const state = new URL(returnTo).searchParams.get('state')!;
    return { state, answer: steamAnswer({ state, 'openid.return_to': returnTo }) };
  }

  it('creates an account without email, named after the Steam profile', async () => {
    steamSays(true);
    const { state, answer } = startLogin();
    const code = await service.finishSteam(service.takePending('steam', state)!, answer);
    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(users.create).toHaveBeenCalledWith({ Username: 'Gabe.Newell', Email: null, Password: null });
    expect(identities.save).toHaveBeenCalledWith({ UserId: 9, Provider: 'steam', ProviderUserId: STEAM_ID });
    expect(await service.exchange(code, VERIFIER)).toMatchObject({ accessToken: 'a' });
  });

  it('falls back to steam-<last digits> when the profile name gives nothing', async () => {
    vitest.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url) === STEAM_LOGIN
        ? new Response('is_valid:true\n')
        : new Response('<steamID><![CDATA[🎮]]></steamID>'),
    );
    const { state, answer } = startLogin();
    await service.finishSteam(service.takePending('steam', state)!, answer);
    expect(users.create.mock.calls[0][0].Username).toBe('steam-287930');
  });

  it("won't accept an answer made for another login", async () => {
    steamSays(true);
    const first = startLogin();
    const second = startLogin();
    // The second login's state with the first login's Steam answer.
    await expect(
      service.finishSteam(service.takePending('steam', second.state)!, first.answer),
    ).rejects.toThrow(UnauthorizedException);
    expect(users.create).not.toHaveBeenCalled();
  });
});
