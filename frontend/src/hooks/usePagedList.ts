import { useCallback, useEffect, useState } from "react";

import { apiRequest, getErrorMessage } from "../services/api";

export type SortOrder = "asc" | "desc";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Loads one page of a list endpoint that supports
 * ?search=&sort=&order=&page=&pageSize= and returns { items, total, page, pageSize }.
 */
export function usePagedList<T>(endpoint: string, defaultSort = "id") {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(defaultSort);
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<PagedResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wait until typing pauses before searching, and start again from page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      search,
      sort,
      order,
      page: String(page),
      pageSize: String(pageSize),
    });

    apiRequest<PagedResponse<T>>(`${endpoint}?${params}`)
      .then((result) => {
        if (cancelled) return;
        // Deleting the last row on the last page leaves it empty; step back a page.
        if (result.items.length === 0 && page > 1 && result.total > 0) {
          setPage(Math.max(1, Math.ceil(result.total / pageSize)));
          return;
        }
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load data."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, search, sort, order, page, pageSize, reloadKey]);

  const toggleSort = useCallback(
    (column: string) => {
      if (column === sort) {
        setOrder((current) => (current === "asc" ? "desc" : "asc"));
      } else {
        setSort(column);
        setOrder("asc");
      }
      setPage(1);
    },
    [sort]
  );

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    sort,
    order,
    search: searchInput,
    activeSearch: search,
    loading,
    error,
    setSearch: setSearchInput,
    setPage,
    setPageSize: changePageSize,
    toggleSort,
    reload,
  };
}
