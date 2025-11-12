"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";
import { Item } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { RestaurantSelector } from "./RestaurantSelector";
import { AppImage } from "@/components/ui/Image";

async function searchMenu(query: string, restaurantId?: string | null) {
  const params = new URLSearchParams();
  if (query) {
    params.append("q", query);
  }
  if (restaurantId) {
    params.append("restaurantId", restaurantId);
  }
  // If no query but restaurant selected, get all items from that restaurant
  if (!query && restaurantId) {
    params.append("q", "");
  }
  const response = await fetch(`/api/menu/search?${params}`);
  if (!response.ok) throw new Error("Failed to search menu");
  const data = await response.json();
  return data.items as Item[];
}

export function SearchBar() {
  const { searchQuery, setSearchQuery, selectedRestaurantId } = useUIStore();
  const [localQuery, setLocalQuery] = useState("");

  // Enable search when:
  // - User has typed a query, OR
  // - A restaurant is selected (show all items from that restaurant)
  const shouldSearch = localQuery.length > 0 || selectedRestaurantId !== null;

  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["menu-search", localQuery || "", selectedRestaurantId || ""],
    queryFn: () => searchMenu(localQuery, selectedRestaurantId),
    enabled: shouldSearch,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localQuery);
    // The query will automatically refetch due to queryKey change
  };

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <div className="w-full space-y-4">
      {/* Restaurant Selector */}
      <RestaurantSelector />

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={
            selectedRestaurantId
              ? "Search items in selected restaurant..."
              : "Search for menu items..."
          }
          className="w-full px-4 py-3 pl-12 pr-24 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-macscore-red focus:border-transparent"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          🔍
        </div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-macscore-red rounded-lg hover:bg-macscore-red/90 focus:outline-none focus:ring-2 focus:ring-macscore-red focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && shouldSearch && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-gray-500">Searching...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage
          message="Failed to search menu. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {/* Results */}
      {items && items.length > 0 && !isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              {selectedRestaurantId
                ? `Items (${items.length})`
                : `Results (${items.length})`}
            </h3>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {items.map((item) => (
              <SearchResultItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {items && items.length === 0 && shouldSearch && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">No items found</p>
          <p className="text-sm">
            {localQuery
              ? "Try a different search term or clear the search."
              : selectedRestaurantId
              ? "This restaurant has no items yet."
              : "Try selecting a restaurant or searching for items."}
          </p>
        </div>
      )}

      {/* Initial State - Show when no restaurant selected and no search query */}
      {!selectedRestaurantId && !localQuery && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🍔</div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Get started
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Select a restaurant above or search for items
          </p>
          <p className="text-xs text-gray-400">
            Tip: Type a search term like &quot;burger&quot; or &quot;chicken&quot; to see items from all restaurants
          </p>
        </div>
      )}
    </div>
  );
}

function SearchResultItem({ item }: { item: Item }) {
  const { openCustomizer, activeItemId } = useUIStore();

  const handleClick = () => {
    openCustomizer(item.id);
  };

  const isActive = activeItemId === item.id;

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
        isActive
          ? "bg-macscore-red text-white border-macscore-red shadow-md"
          : "bg-white border-gray-200 hover:shadow-md hover:border-macscore-red"
      }`}
    >
      {/* Item Image */}
      <div className="flex-shrink-0">
        <AppImage
          src={item.image_url}
          alt={item.name}
          width={64}
          height={64}
          className="rounded-lg"
          fallback={<div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg text-2xl">🍔</div>}
        />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold truncate ${isActive ? "text-white" : "text-gray-800"}`}>
          {item.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <p className={`text-sm ${isActive ? "text-white/90" : "text-gray-500"}`}>
            {item.base_calories.toFixed(0)} kcal
          </p>
          {item.description && (
            <span className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"}`}>•</span>
          )}
          {item.description && (
            <p className={`text-xs truncate ${isActive ? "text-white/80" : "text-gray-400"}`}>
              {item.description}
            </p>
          )}
        </div>
      </div>
      {isActive && (
        <div className="ml-2 flex-shrink-0">
          <span className="text-white text-sm font-bold">✓</span>
        </div>
      )}
    </div>
  );
}
