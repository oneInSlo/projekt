import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchSalons, getCategories } from '../src/controllers/salon.controller.js';
import { mockRes, mockDb } from './helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('searchSalons', () => {
  it('combines region, category and name filters', async () => {
    const db = mockDb({ rows: [] });
    const res = mockRes();

    await searchSalons({ query: { region: '3', category: '2', name: 'nail' }, db }, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('s.category_id = $1::int');
    expect(sql).toContain('s.name ILIKE $2');
    expect(sql).toContain('s.region_id = $3::int');
    expect(params.slice(0, 3)).toEqual(['2', '%nail%', 3]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('caps the page size at 50', async () => {
    const db = mockDb({ rows: [] });

    await searchSalons({ query: { limit: '500' }, db }, mockRes());

    const [, params] = db.query.mock.calls[0];
    expect(params).toEqual([51, 0]);
  });

  it('reports hasMore when there are more results than the limit', async () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const res = mockRes();

    await searchSalons({ query: { limit: '2' }, db: mockDb({ rows }) }, res);

    expect(res.json).toHaveBeenCalledWith({
      salons: [{ id: 'a' }, { id: 'b' }],
      limit: 2,
      offset: 0,
      hasMore: true,
    });
  });
});

describe('getCategories', () => {
  it('returns categories from the database', async () => {
    const categories = [{ id: 1, name: 'Gel in akrilni nohti' }];
    const res = mockRes();

    await getCategories({ db: mockDb({ rows: categories }) }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ categories });
  });

  it('returns 500 when the database query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();

    await getCategories({ db: mockDb(new Error('connection lost')) }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
