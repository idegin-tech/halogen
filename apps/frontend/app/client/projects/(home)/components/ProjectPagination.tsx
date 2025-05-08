'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

interface ProjectPaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function ProjectPagination({ currentPage, totalPages, hasNextPage, hasPrevPage }: ProjectPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/client/projects?${params.toString()}`);
  };

  // Generate an array of visible page numbers
  const getVisiblePages = () => {
    // Always show first and last page
    // Show 2 pages before and after current page when possible
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | 'dots')[] = [];

    // Calculate range
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Add first page
    if (currentPage > delta + 1) {
      rangeWithDots.push(1);
      if (currentPage > delta + 2) {
        rangeWithDots.push('dots');
      }
    }

    // Add middle pages
    rangeWithDots.push(...range);

    // Add last page
    if (currentPage < totalPages - delta) {
      if (currentPage < totalPages - delta - 1) {
        rangeWithDots.push('dots');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </PaginationItem>
        
        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            className="h-8 w-8"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </PaginationItem>

        {visiblePages.map((page, i) => 
          page === 'dots' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="h-8 w-8"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </PaginationItem>

        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}