import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const ListPagination: React.FC<ListPaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0 || totalItems <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const firstItem = (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#EAE6DD] dark:border-[#29484C] bg-[#FFFFFF] dark:bg-[#183238] px-4 py-3 text-sm">
      <p className="text-[#7B7468] dark:text-[#9FB5B3] tabular-nums">
        Showing <strong className="text-[#2B2417] dark:text-[#E4EFED]">{firstItem}–{lastItem}</strong> of{' '}
        <strong className="text-[#2B2417] dark:text-[#E4EFED]">{totalItems}</strong>
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[#7B7468] dark:text-[#9FB5B3]">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-[#EAE6DD] dark:border-[#29484C] bg-[#FFF4DF] dark:bg-[#13282D] px-2 py-1.5 text-[#2B2417] dark:text-[#E4EFED] focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            className="rounded-lg border border-[#EAE6DD] dark:border-[#29484C] p-2 text-[#2B2417] dark:text-[#E4EFED] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#FFF4DF] dark:hover:bg-[#13282D]"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center text-[#526A6C] dark:text-[#AFC2C0] tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="rounded-lg border border-[#EAE6DD] dark:border-[#29484C] p-2 text-[#2B2417] dark:text-[#E4EFED] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#FFF4DF] dark:hover:bg-[#13282D]"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
