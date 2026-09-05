import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { CreateRole } from '@/contexts/iam/role/application/create/create-role'
import { RegisterUser } from '@/contexts/iam/user/application/register/register-user'

/**
 * Pre-migration regression net for `sdd/fix-iam-cqrs-to-run` (design D1-D4).
 * Written and passed GREEN against the CURRENT @nestjs/cqrs-wired iam code
 * (Login/RefreshTokenUseCase/Logout/FindUser/FindAllRoles/FindRole invoked
 * via CommandBus/QueryBus). Must stay byte-identical (spec C3) through PR2
 * and PR3, which migrate the controllers to call `.run()` directly. Any
 * diff to this file outside PR1 invalidates it as a regression net.
 *
 * Zero `src/` changes accompany this file (spec C4).
 *
 * Seeding (design D1): pulls `CreateRole` and `RegisterUser` use cases
 * directly from the booted app's DI container and calls `.run()` in
 * `beforeEach`, after `resetDatabase()`. This is NOT HTTP registration
 * (blocked/circular: `POST /users/register` requires an admin caller via
 * `RolesGuard`, which does a real DB lookup — `signAccessToken()` mints a
 * token for a user that does not exist in the DB, so `RolesGuard` would
 * throw `ForbiddenException('User not found')`), NOT an Object Mother (none
 * exist for iam), and NOT raw SQL (would hardcode an opaque argon2 hash
 * literal and bypass `User.create()` invariants). `RegisterUser`
 * constructor-injects the real `Argon2PasswordHasher`, so the persisted
 * hash is genuine and `Login.run()`'s `passwordHasher.verify(...)` accepts
 * the plaintext password kept in this file.
 *
 * A role is seeded even though `users.role_id` carries no DB-level FK to
 * `roles`, because `RolesGuard` performs a real `roleRepository.search(...)`
 * lookup and throws `ForbiddenException('Role not found')` when absent (it
 * is not exercised by these scenarios today, but keeps the fixture
 * realistic and robust against a future `@Roles` decorator). No employee
 * row is seeded — `employees.user_id` is nullable and irrelevant here.
 *
 * `GET /auth/me` is exercised with the LOGIN-issued access token (design
 * D3), not `signAccessToken()` — the latter mints a token for a nonexistent
 * user id, which would make `FindUser.run()` throw `UserNotFound`.
 *
 * `InvalidCredentials` and `TokenTheftDetected` both extend
 * `BusinessRuleViolationException`, which `DomainExceptionFilter` maps to
 * `422 Unprocessable Entity` (verified against
 * `src/core/filters/domain-exception.filter.ts`) — not `401`. `401` is
 * reserved for `JwtAuthGuard` rejecting requests with no/invalid bearer
 * token.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']

  const plainPassword = 'Str0ng!Passw0rd'
  let roleId: string
  let userId: string
  let username: string
  let email: string

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase(dataSource)

    roleId = UuidMother.random()
    userId = UuidMother.random()
    username = 'e2e-auth-user'
    email = 'e2e-auth-user@example.test'

    await app.get(CreateRole).run(roleId, 'admin', null)
    await app.get(RegisterUser).run(userId, username, email, plainPassword, null, roleId)
  })

  describe('POST /auth/login', () => {
    it('rejects a wrong password with the mapped BusinessRuleViolationException status', async () => {
      const response = await http()
        .post('/auth/login')
        .send({ username, password: 'wrong-password' })

      expect(response.status).toBe(422)
      expect(response.headers['set-cookie']).toBeUndefined()
    })

    it('returns access token and public user fields only, refresh token cookie-only', async () => {
      const response = await http().post('/auth/login').send({ username, password: plainPassword })

      expect(response.status).toBe(200)
      expect(Object.keys(response.body).sort()).toEqual(['accessToken', 'user'])
      expect(Object.keys(response.body.user).sort()).toEqual(['email', 'id', 'username'])
      expect(response.body.user).toEqual({ id: userId, username, email })

      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      const refreshCookie = (cookies as unknown as string[]).find(cookie =>
        cookie.startsWith('refreshToken=')
      )
      expect(refreshCookie).toBeDefined()
      expect(refreshCookie).toMatch(/HttpOnly/i)

      const bodyAsString = JSON.stringify(response.body)
      const refreshTokenValue = refreshCookie!.split(';')[0].split('=')[1]
      expect(bodyAsString.includes(refreshTokenValue)).toBe(false)
    })
  })

  describe('GET /auth/me', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const response = await http().get('/auth/me')

      expect(response.status).toBe(401)
    })

    it('returns the exact authenticated-user shape, credentials excluded — byte-identical guard', async () => {
      const loginResponse = await http()
        .post('/auth/login')
        .send({ username, password: plainPassword })
      const { accessToken } = loginResponse.body

      const response = await http().get('/auth/me').set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(Object.keys(response.body).sort()).toEqual(
        [
          'createdAt',
          'email',
          'fullName',
          'id',
          'isActive',
          'isEmailVerified',
          'lastLoginAt',
          'roleId',
          'username'
        ].sort()
      )
      expect(response.body).not.toHaveProperty('passwordHash')
      expect(response.body).not.toHaveProperty('password_hash')
      expect(response.body).not.toHaveProperty('refreshToken')
      expect(response.body).not.toHaveProperty('refreshTokens')
    })
  })

  describe('POST /auth/refresh', () => {
    it('rotates tokens on a valid refresh cookie', async () => {
      const loginResponse = await http()
        .post('/auth/login')
        .send({ username, password: plainPassword })
      const originalCookie = (loginResponse.headers['set-cookie'] as unknown as string[]).find(
        cookie => cookie.startsWith('refreshToken=')
      )!

      const response = await http().post('/auth/refresh').set('Cookie', originalCookie)

      expect(response.status).toBe(200)
      expect(Object.keys(response.body).sort()).toEqual(['accessToken'])

      const rotatedCookie = (response.headers['set-cookie'] as unknown as string[]).find(cookie =>
        cookie.startsWith('refreshToken=')
      )!
      expect(rotatedCookie.split(';')[0]).not.toBe(originalCookie.split(';')[0])
    })
  })

  describe('POST /auth/logout', () => {
    it('revokes the current refresh token, clears the cookie, and blocks reuse via theft detection', async () => {
      const loginResponse = await http()
        .post('/auth/login')
        .send({ username, password: plainPassword })
      const { accessToken } = loginResponse.body
      const loginCookie = (loginResponse.headers['set-cookie'] as unknown as string[]).find(
        cookie => cookie.startsWith('refreshToken=')
      )!

      // `logout` is not @Public(), so the global JwtAuthGuard requires a
      // valid access token in addition to JwtRefreshGuard's cookie check.
      const logoutResponse = await http()
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', loginCookie)

      expect(logoutResponse.status).toBe(204)
      expect(logoutResponse.body).toEqual({})
      const clearedCookie = (logoutResponse.headers['set-cookie'] as unknown as string[]).find(
        cookie => cookie.startsWith('refreshToken=')
      )!
      expect(clearedCookie).toBeDefined()

      // Reusing the now-revoked cookie must trigger theft detection (422),
      // not succeed — covers RefreshTokenUseCase's theft-detection branch.
      const replayResponse = await http().post('/auth/refresh').set('Cookie', loginCookie)

      expect(replayResponse.status).toBe(422)
    })
  })

  describe('GET /users/:id — PR2 regression anchor', () => {
    it('returns the exact user shape, credentials excluded, matching /auth/me', async () => {
      const loginResponse = await http()
        .post('/auth/login')
        .send({ username, password: plainPassword })
      const { accessToken } = loginResponse.body

      const response = await http()
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(Object.keys(response.body).sort()).toEqual(
        [
          'createdAt',
          'email',
          'fullName',
          'id',
          'isActive',
          'isEmailVerified',
          'lastLoginAt',
          'roleId',
          'username'
        ].sort()
      )
      expect(response.body).not.toHaveProperty('passwordHash')
      expect(response.body).not.toHaveProperty('password_hash')
      expect(response.body).not.toHaveProperty('refreshToken')
      expect(response.body).not.toHaveProperty('refreshTokens')
    })
  })

  describe('GET /roles, GET /roles/:id — PR2 regression anchor', () => {
    it('returns the exact role shape for findOne and findAll', async () => {
      const loginResponse = await http()
        .post('/auth/login')
        .send({ username, password: plainPassword })
      const { accessToken } = loginResponse.body

      const findOneResponse = await http()
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(findOneResponse.status).toBe(200)
      expect(Object.keys(findOneResponse.body).sort()).toEqual(['description', 'id', 'name'])

      const findAllResponse = await http()
        .get('/roles')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(findAllResponse.status).toBe(200)
      expect(Array.isArray(findAllResponse.body)).toBe(true)
      expect(
        findAllResponse.body.every(
          (role: object) => Object.keys(role).sort().join(',') === 'description,id,name'
        )
      ).toBe(true)
      expect(findAllResponse.body.some((role: { id: string }) => role.id === roleId)).toBe(true)
    })
  })
})
