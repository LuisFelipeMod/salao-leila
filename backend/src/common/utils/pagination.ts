export function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    lastPage: Math.ceil(total / limit),
  };
}
