// Helpers for paged, searchable, sortable list queries.

// Escapes LIKE wildcards so a search for "50%" matches the literal text.
function likePattern(search) {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * Builds ORDER BY and LIMIT clauses from validated query options.
 * `sortColumns` maps public sort keys to SQL expressions; unknown keys fall back to `defaultSort`.
 * LIMIT/OFFSET are inlined because MySQL prepared statements reject them as placeholders;
 * they are validated integers, so this is safe.
 */
function buildOrderAndLimit({ sort, order, page, pageSize }, sortColumns, defaultSort) {
  const column = sortColumns[sort] || sortColumns[defaultSort];
  const direction = order === "asc" ? "ASC" : "DESC";
  const limit = Math.trunc(pageSize);
  const offset = Math.trunc((page - 1) * pageSize);

  // Secondary sort on the primary key keeps paging stable when values tie.
  return `ORDER BY ${column} ${direction}, ${sortColumns.id} ${direction} LIMIT ${limit} OFFSET ${offset}`;
}

module.exports = { likePattern, buildOrderAndLimit };
