import type { ReactNode } from "react";
import { MdArrowDownward, MdArrowUpward, MdSearch, MdUnfoldMore } from "react-icons/md";

import styles from "./TableControls.module.css";
import type { SortOrder } from "../../../hooks/usePagedList";

const PAGE_SIZES = [10, 25, 50, 100];

type ToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
};

export const TableToolbar = ({
  search,
  onSearchChange,
  placeholder,
  pageSize,
  onPageSizeChange,
}: ToolbarProps) => (
  <div className={styles.toolbar}>
    <label className={styles.search}>
      <MdSearch aria-hidden="true" className={styles.searchIcon} />
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>

    <label className={styles.pageSize}>
      Rows per page
      <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  </div>
);

type SortableHeaderProps = {
  column: string;
  sort: string;
  order: SortOrder;
  onSort: (column: string) => void;
  children: ReactNode;
};

export const SortableHeader = ({ column, sort, order, onSort, children }: SortableHeaderProps) => {
  const active = column === sort;
  const Icon = !active ? MdUnfoldMore : order === "asc" ? MdArrowUpward : MdArrowDownward;

  return (
    <th aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(column)}>
        {children}
        <Icon aria-hidden="true" className={active ? styles.sortIconActive : styles.sortIcon} />
      </button>
    </th>
  );
};

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({ page, pageSize, total, onPageChange }: PaginationProps) => {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className={styles.pagination}>
      <span className={styles.summary}>
        {total === 0 ? "No results" : `Showing ${first}–${last} of ${total}`}
      </span>

      <div className={styles.pageButtons}>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <span className={styles.pageNumber}>
          Page {page} of {lastPage}
        </span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= lastPage}>
          Next
        </button>
      </div>
    </div>
  );
};
