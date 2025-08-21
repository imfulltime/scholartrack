'use client'

import { useState, useMemo } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface SearchFilterProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchFilter({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "" 
}: SearchFilterProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  )
}

interface MultiFilterProps<T> {
  items: T[]
  searchQuery: string
  onSearchChange: (query: string) => void
  searchFields: (keyof T)[]
  children: (filteredItems: T[]) => React.ReactNode
  emptyMessage?: string
  resultCount?: boolean
}

export function MultiFilter<T>({ 
  items, 
  searchQuery, 
  onSearchChange, 
  searchFields, 
  children,
  emptyMessage = "No items found",
  resultCount = true
}: MultiFilterProps<T>) {
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        if (typeof value === 'number') {
          return value.toString().includes(query)
        }
        return false
      })
    )
  }, [items, searchQuery, searchFields])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchFilter
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={`Search ${items.length} items...`}
          className="flex-1 max-w-sm"
        />
        {resultCount && searchQuery && (
          <div className="text-sm text-gray-500 ml-4">
            {filteredItems.length} of {items.length} items
          </div>
        )}
      </div>
      
      {filteredItems.length === 0 && searchQuery ? (
        <div className="text-center py-8">
          <Filter className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No results found for "{searchQuery}"
          </p>
          <button
            onClick={() => onSearchChange('')}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Clear search
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        children(filteredItems)
      )}
    </div>
  )
}
