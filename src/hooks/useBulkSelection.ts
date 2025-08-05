import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionProps<T> {
  items: T[];
  getItemId: (item: T) => string | number;
}

interface UseBulkSelectionReturn<T> {
  selectedItems: Set<string | number>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  selectedCount: number;
  totalCount: number;
  selectedItemsData: T[];
  toggleItem: (itemId: string | number) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  selectItems: (itemIds: (string | number)[]) => void;
  isSelected: (itemId: string | number) => boolean;
}

export function useBulkSelection<T>({
  items,
  getItemId,
}: UseBulkSelectionProps<T>): UseBulkSelectionReturn<T> {
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const totalCount = items.length;
  const selectedCount = selectedItems.size;

  const isAllSelected = useMemo(() => {
    return totalCount > 0 && selectedCount === totalCount;
  }, [totalCount, selectedCount]);

  const isIndeterminate = useMemo(() => {
    return selectedCount > 0 && selectedCount < totalCount;
  }, [selectedCount, totalCount]);

  const selectedItemsData = useMemo(() => {
    return items.filter(item => selectedItems.has(getItemId(item)));
  }, [items, selectedItems, getItemId]);

  const toggleItem = useCallback((itemId: string | number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(getItemId)));
    }
  }, [isAllSelected, items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectItems = useCallback((itemIds: (string | number)[]) => {
    setSelectedItems(new Set(itemIds));
  }, []);

  const isSelected = useCallback((itemId: string | number) => {
    return selectedItems.has(itemId);
  }, [selectedItems]);

  return {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    selectedCount,
    totalCount,
    selectedItemsData,
    toggleItem,
    toggleAll,
    clearSelection,
    selectItems,
    isSelected,
  };
}

export default useBulkSelection;
