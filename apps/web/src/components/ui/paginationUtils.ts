export function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const safeTotalPages = Number.isSafeInteger(totalPages) && totalPages > 0 ? totalPages : 1;
  const normalizedCurrentPage = Number.isSafeInteger(currentPage) ? currentPage : 1;
  const safeCurrentPage = Math.min(Math.max(1, normalizedCurrentPage), safeTotalPages);

  if (safeTotalPages <= 5) {
    return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
  }

  return [
    ...new Set([1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, safeTotalPages]),
  ]
    .filter((page) => page >= 1 && page <= safeTotalPages)
    .sort((left, right) => left - right);
}

export function getPageSlice<T>(items: T[], currentPage: number, pageSize: number) {
  const safePageSize = Number.isSafeInteger(pageSize) && pageSize > 0 ? pageSize : 1;
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const normalizedCurrentPage = Number.isSafeInteger(currentPage) ? currentPage : 1;
  const safeCurrentPage = Math.min(Math.max(1, normalizedCurrentPage), totalPages);
  const pageStart = (safeCurrentPage - 1) * safePageSize;

  return {
    items: items.slice(pageStart, pageStart + safePageSize),
    pageStart,
    safeCurrentPage,
    totalPages,
  };
}
