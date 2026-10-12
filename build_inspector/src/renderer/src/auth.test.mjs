/* eslint-disable @typescript-eslint/explicit-function-return-type -- Test JavaScript eseguiti direttamente con Node. */
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { getSession, register, signIn, signOut, validateCredentials } from './auth.ts'

class MemoryStorage {
  values = new Map()
  getItem(key) {
    return this.values.get(key) ?? null
  }
  setItem(key, value) {
    this.values.set(key, String(value))
  }
  removeItem(key) {
    this.values.delete(key)
  }
  clear() {
    this.values.clear()
  }
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: new MemoryStorage(),
    configurable: true
  })
})

const password = 'Una frase di prova 2026!'
const accountsKey = 'build-inspector.accounts.v1'
const sessionKey = 'build-inspector.session.v1'

test('registration validates name, email, length and confirmation', () => {
  assert.deepEqual(
    Object.keys(
      validateCredentials('register', {
        name: ' ',
        email: 'broken',
        password: 'short',
        confirmPassword: 'different'
      })
    ),
    ['name', 'email', 'password', 'confirmPassword']
  )
  assert.deepEqual(
    validateCredentials('login', {
      name: '',
      email: 'a@example.com',
      password,
      confirmPassword: ''
    }),
    {}
  )
})

test('registration stores a salted verifier, creates a session, and rejects duplicate email', async () => {
  const profile = await register(' Player ', ' PLAYER@example.com ', password, false)
  assert.equal(profile.name, 'Player')
  assert.equal(profile.email, 'player@example.com')
  assert.deepEqual(getSession(), profile)
  assert.equal(localStorage.getItem(sessionKey), null)
  assert.ok(sessionStorage.getItem(sessionKey))
  const stored = localStorage.getItem(accountsKey)
  assert.ok(!stored.includes(password))
  assert.equal(JSON.parse(stored)[0].verifier.length, 64)
  await assert.rejects(register('Player', 'player@EXAMPLE.com', password, false), /già un profilo/)
  assert.equal(JSON.parse(localStorage.getItem(accountsKey)).length, 1)
})

test('wrong credentials cannot sign in and logout removes remembered sessions', async () => {
  const original = await register('Player', 'player@example.com', password, true)
  assert.ok(localStorage.getItem(sessionKey))
  signOut()
  assert.equal(getSession(), null)
  await assert.rejects(signIn('player@example.com', 'wrong password', true), /non corrette/)
  await assert.rejects(signIn('unknown@example.com', password, true), /non corrette/)
  assert.equal(getSession(), null)
  assert.deepEqual(await signIn(' PLAYER@EXAMPLE.COM ', password, false), original)
  assert.equal(localStorage.getItem(sessionKey), null)
  signOut()
  assert.equal(sessionStorage.getItem(sessionKey), null)
})

test('expired and unknown sessions do not restore a profile', async () => {
  const profile = await register('Player', 'player@example.com', password, true)
  localStorage.setItem(sessionKey, JSON.stringify({ id: profile.id, expiresAt: Date.now() - 1 }))
  assert.equal(getSession(), null)
  assert.equal(localStorage.getItem(sessionKey), null)
  localStorage.setItem(sessionKey, JSON.stringify({ id: 'missing', expiresAt: Date.now() + 10000 }))
  assert.equal(getSession(), null)
})

test('corrupt accounts fail without overwriting existing data', async () => {
  localStorage.setItem(accountsKey, '{broken')
  await assert.rejects(
    register('Player', 'player@example.com', password, false),
    /leggere i profili/
  )
  assert.equal(localStorage.getItem(accountsKey), '{broken')
  assert.equal(getSession(), null)
})

test('each profile receives a different salt and verifier for the same password', async () => {
  await register('One', 'one@example.com', password, false)
  const second = await register('Two', 'two@example.com', password, false)
  const accounts = JSON.parse(localStorage.getItem(accountsKey))
  assert.notEqual(accounts[0].salt, accounts[1].salt)
  assert.notEqual(accounts[0].verifier, accounts[1].verifier)
  assert.deepEqual(getSession(), second)
})

test('storage write failures are reported as a failed registration', async () => {
  localStorage.setItem = () => {
    throw new Error('quota exceeded')
  }
  await assert.rejects(
    register('Player', 'player@example.com', password, false),
    /Profilo non salvato/
  )
  assert.equal(getSession(), null)
})
