import { paginate } from './pagination';

describe('paginate', () => {
  it('returns data, total, page and lastPage', () => {
    const result = paginate(['a', 'b', 'c'], 30, 2, 10);
    expect(result).toEqual({ data: ['a', 'b', 'c'], total: 30, page: 2, lastPage: 3 });
  });

  it('rounds lastPage up', () => {
    expect(paginate([], 25, 1, 10).lastPage).toBe(3);
  });

  it('lastPage is 1 when total equals limit', () => {
    expect(paginate([], 10, 1, 10).lastPage).toBe(1);
  });

  it('lastPage is 1 when total is 0', () => {
    expect(paginate([], 0, 1, 10).lastPage).toBe(0);
  });
});
