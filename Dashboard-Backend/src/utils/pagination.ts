export function parsePagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 10));
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize, page, pageSize };
}

export function parseSorting(
  query: any,
  allowedFields: string[],
  defaultField = "createdAt",
  defaultOrder: "asc" | "desc" = "desc"
) {
  const querySortBy = query.sortBy || query.sort;
  const querySortOrder = query.sortOrder || query.order;

  const sortBy = allowedFields.includes(querySortBy)
    ? querySortBy
    : defaultField;
  const sortOrder =
    querySortOrder === "asc" || querySortOrder === "desc"
      ? querySortOrder
      : defaultOrder;
  return { orderBy: { [sortBy]: sortOrder } };
}
