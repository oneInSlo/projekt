import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import authenticateToken from '../src/middleware/auth.middleware.js';
import { mockRes } from './helpers.js';

const SECRET = 'test-access-secret';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

const reqWithToken = (token) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

describe('authenticateToken', () => {
  it('returns 401 when no token is provided', () => {
    const res = mockRes();
    const next = vi.fn();

    authenticateToken(reqWithToken(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for a malformed token', () => {
    const res = mockRes();
    const next = vi.fn();

    authenticateToken(reqWithToken('not-a-jwt'), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token format.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for an expired token', () => {
    const expired = jwt.sign({ id: 'u1', exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);
    const res = mockRes();
    const next = vi.fn();

    authenticateToken(reqWithToken(expired), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired. Please login again.' });
  });

  it('calls next and sets req.user for a valid token', () => {
    const token = jwt.sign({ id: 'u1', email: 'ana@example.com' }, SECRET, { expiresIn: '15m' });
    const req = reqWithToken(token);
    const next = vi.fn();

    authenticateToken(req, mockRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ id: 'u1', email: 'ana@example.com' });
  });
});
