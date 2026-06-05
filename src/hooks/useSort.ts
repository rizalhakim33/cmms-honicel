import { useState, useMemo } from 'react';

export function useSort<T>(items: T[], initialField: keyof T | '' = '', initialDirection: 'asc' | 'desc' = 'asc') {
  const [sortField, setSortField] = useState<keyof T | ''>(initialField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialDirection);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle nested values generically if needed, but for now simple comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase() as any;
      if (typeof bVal === 'string') bVal = bVal.toLowerCase() as any;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection]);

  return { sortedItems, sortField, sortDirection, handleSort };
}
