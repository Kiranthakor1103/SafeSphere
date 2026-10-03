import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= itemsPerPage)) {
    if (!totalItems || totalItems === 0) return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const selectOptions = pageSizeOptions.map(size => ({
    value: String(size),
    label: String(size),
  }));

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        {totalItems !== undefined ? (
          <>Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries</>
        ) : (
          <>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></>
        )}
      </div>

      <div className="pagination-controls">
        {onItemsPerPageChange && (
          <div className="pagination-size-select" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="size-label">Per page:</span>
            <CustomSelect
              size="sm"
              dropDirection="up"
              value={String(itemsPerPage)}
              onChange={(val) => onItemsPerPageChange(Number(val))}
              options={selectOptions}
              style={{ width: 72, marginBottom: 0 }}
            />
          </div>
        )}

        <div className="pagination-buttons">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((p, idx) => (
            typeof p === 'number' ? (
              <button
                key={idx}
                type="button"
                className={`pagination-btn page-num ${p === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="pagination-ellipsis">...</span>
            )
          ))}

          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
