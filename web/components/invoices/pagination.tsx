'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

function PaginationComponent({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const handlePrev = useCallback(() => onPageChange(page - 1), [onPageChange, page]);
  const handleNext = useCallback(() => onPageChange(page + 1), [onPageChange, page]);

  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Paginacao de faturas">
      <p className="text-sm text-muted-foreground">
        Pagina {page} de {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || page <= 1}
          onClick={handlePrev}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || page >= totalPages}
          onClick={handleNext}
        >
          Proxima
        </Button>
      </div>
    </nav>
  );
}

export const Pagination = memo(PaginationComponent);
