"use client";

import React from "react";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { MealTray } from "@/components/dashboard/MealTray";
import { ItemCustomizer } from "@/components/meal-builder/ItemCustomizer";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl burger-animate">🍔</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">MacScore</h1>
                <p className="text-sm text-gray-600">Fast food, smarter choices</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Search (takes 4 columns) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Search Menu
              </h2>
              <SearchBar />
            </div>
          </div>

          {/* Right Column - Customizer or Meal Tray (takes 8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            <ItemCustomizer />
            <MealTray />
          </div>
        </div>
      </main>
    </div>
  );
}
