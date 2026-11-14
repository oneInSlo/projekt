import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import { register, login } from '../src/controllers/user.controller.js';
import { mockRes, mockDb } from './helpers.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

const validCustomer = {
  email: 'Ana@Example.COM',
  password: 'geslo12345',
  first_name: 'Ana',
  last_name: 'Novak',
  role: 'customer',
};

describe('register', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = mockRes();
    await register({ body: { email: 'ana@example.com' }, db: mockDb() }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for an invalid email', async () => {
    const res = mockRes();
    await register({ body: { ...validCustomer, email: 'ni-email' }, db: mockDb() }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email format' });
  });

  it('returns 400 for a password shorter than 8 characters', async () => {
    const res = mockRes();
    await register({ body: { ...validCustomer, password: 'kratko' }, db: mockDb() }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 8 characters' });
  });

  it('rejects self-registration as admin', async () => {
    const res = mockRes();
    const db = mockDb();
    await register({ body: { ...validCustomer, role: 'admin' }, db }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role for self-registration' });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('requires a display name for salon managers', async () => {
    const res = mockRes();
    await register({ body: { ...validCustomer, role: 'salon_manager' }, db: mockDb() }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Display name is required for salon managers' });
  });

  it('returns 409 when the email already exists', async () => {
    const duplicate = Object.assign(new Error('duplicate key'), { code: '23505' });
    const res = mockRes();
    await register({ body: validCustomer, db: mockDb(duplicate) }, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
  });

  it('creates a customer with a normalized email and hashed password', async () => {
    const db = mockDb(
      { rows: [{ id: 'u1', email: 'ana@example.com', first_name: 'Ana', last_name: 'Novak' }] },
      { rows: [{ user_id: 'u1' }] },
    );
    const res = mockRes();

    await register({ body: validCustomer, db }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const [, params] = db.query.mock.calls[0];
    expect(params[0]).toBe('ana@example.com');
    expect(params[1]).not.toBe(validCustomer.password);
    expect(await bcrypt.compare(validCustomer.password, params[1])).toBe(true);
    expect(res.json.mock.calls[0][0].user).not.toHaveProperty('password_hash');
  });
});

describe('login', () => {
  const storedUser = async (overrides = {}) => ({
    id: 'u1',
    email: 'ana@example.com',
    password_hash: await bcrypt.hash('geslo12345', 4),
    first_name: 'Ana',
    last_name: 'Novak',
    is_active: true,
    role: 'customer',
    ...overrides,
  });

  it('returns 400 when email or password is missing', async () => {
    const res = mockRes();
    await login({ body: { email: 'ana@example.com' }, db: mockDb() }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 for an unknown user', async () => {
    const res = mockRes();
    await login({ body: { email: 'nihce@example.com', password: 'geslo12345' }, db: mockDb({ rows: [] }) }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  it('returns 401 for a wrong password', async () => {
    const db = mockDb({ rows: [await storedUser()] });
    const res = mockRes();
    await login({ body: { email: 'ana@example.com', password: 'napacno-geslo' }, db }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for a deactivated account', async () => {
    const db = mockDb({ rows: [await storedUser({ is_active: false })] });
    const res = mockRes();
    await login({ body: { email: 'ana@example.com', password: 'geslo12345' }, db }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns an access token and sets the refresh cookie on success', async () => {
    const db = mockDb({ rows: [await storedUser()] }, { rows: [] });
    const res = mockRes();

    await login({ body: { email: 'ana@example.com', password: 'geslo12345' }, db }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toMatchObject({ id: 'u1', role: 'customer' });
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.objectContaining({ httpOnly: true }));
  });
});
