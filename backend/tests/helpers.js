import { vi } from 'vitest';

export const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
};

export const mockDb = (...results) => {
  const query = vi.fn();
  for (const result of results) {
    if (result instanceof Error) query.mockRejectedValueOnce(result);
    else query.mockResolvedValueOnce(result);
  }
  return { query };
};
