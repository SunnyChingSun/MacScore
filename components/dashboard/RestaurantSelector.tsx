"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";
import { Restaurant } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/Image";

async function fetchRestaurants(): Promise<Restaurant[]> {
  const response = await fetch("/api/restaurants");
  if (!response.ok) throw new Error("Failed to fetch restaurants");
  const data = await response.json();
  return data.restaurants as Restaurant[];
}

export function RestaurantSelector() {
  const { selectedRestaurantId, setSelectedRestaurantId } = useUIStore();

  const {
    data: restaurants,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["restaurants"],
    queryFn: fetchRestaurants,
    staleTime: 0, // Always refetch to ensure we get latest data
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-gray-500">Loading restaurants...</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load restaurants"
        onRetry={() => refetch()}
        className="mb-4"
      />
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No restaurants available
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
        Select Restaurant
      </label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setSelectedRestaurantId(null)}
          className={cn(
            "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px]",
            "border-2",
            selectedRestaurantId === null
              ? "bg-macscore-red text-white border-macscore-red"
              : "bg-white text-gray-700 border-gray-300 hover:border-macscore-red hover:text-macscore-red active:bg-gray-50"
          )}
        >
          All
        </button>
        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            type="button"
            onClick={() => setSelectedRestaurantId(restaurant.id)}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px]",
              "border-2 flex items-center gap-1.5 sm:gap-2",
              selectedRestaurantId === restaurant.id
                ? "bg-macscore-red text-white border-macscore-red"
                : "bg-white text-gray-700 border-gray-300 hover:border-macscore-red hover:text-macscore-red active:bg-gray-50"
            )}
          >
            {restaurant.logo_url && (
              <AppImage
                src={restaurant.logo_url}
                alt={restaurant.name}
                width={20}
                height={20}
                className="rounded w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                objectFit="contain"
                fallback={<span className="text-xs">🍔</span>}
              />
            )}
            <span className="truncate max-w-[100px] sm:max-w-none">{restaurant.name}</span>
          </button>
        ))}
      </div>
      {selectedRestaurantId && (
        <p className="mt-2 text-xs text-gray-500">
          Showing items from selected restaurant only
        </p>
      )}
    </div>
  );
}
