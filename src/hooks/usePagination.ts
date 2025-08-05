import { useState, useMemo, useCallback } from 'react';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export interface PaginationResult<T> {
  // Current pagination state
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  
  // Paginated data
  paginatedData: T[];
  
  // Pagination controls
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  
  // Utility functions
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialItemsPerPage?: number;
  resetPageOnDataChange?: boolean;
}

export const usePagination = <T>(
  data: T[],
  options: UsePaginationOptions = {}
): PaginationResult<T> => {
  const {
    initialPage = 1,
    initialItemsPerPage = 25,
    resetPageOnDataChange = true,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Reset page to 1 if current page is out of bounds
  const validCurrentPage = useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
      return 1;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  // Calculate start and end indices
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Get paginated data
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (validCurrentPage < totalPages) {
      setCurrentPage(validCurrentPage + 1);
    }
  }, [validCurrentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (validCurrentPage > 1) {
      setCurrentPage(validCurrentPage - 1);
    }
  }, [validCurrentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPageState(newItemsPerPage);
    
    // Reset to first page when changing items per page
    if (resetPageOnDataChange) {
      setCurrentPage(1);
    }
  }, [resetPageOnDataChange]);

  // Utility values
  const hasNextPage = validCurrentPage < totalPages;
  const hasPreviousPage = validCurrentPage > 1;

  return {
    currentPage: validCurrentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
  };
};

export default usePagination;
