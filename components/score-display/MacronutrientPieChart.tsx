"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { NutritionData } from "@/types";
import { cn } from "@/lib/utils";

interface MacronutrientPieChartProps {
  nutrition: NutritionData;
  className?: string;
}

export function MacronutrientPieChart({
  nutrition,
  className,
}: MacronutrientPieChartProps) {
  const [outerRadius, setOuterRadius] = useState(80);
  const [chartHeight, setChartHeight] = useState(250);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          // Mobile
          setOuterRadius(60);
          setChartHeight(200);
        } else {
          // Desktop
          setOuterRadius(80);
          setChartHeight(250);
        }
      }
    };

    // Set initial size
    updateSize();
    
    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Calculate calories from each macronutrient
  const proteinCalories = nutrition.protein * 4;
  const carbsCalories = nutrition.carbs * 4;
  const fatCalories = nutrition.fat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  // Calculate percentages (only if we have calories from macros)
  const data = [
    {
      name: "Protein",
      value: proteinCalories,
      percentage: totalMacroCalories > 0 ? (proteinCalories / totalMacroCalories) * 100 : 0,
      color: "#2A9D8F", // macscore-green
      calories: proteinCalories,
      grams: nutrition.protein,
    },
    {
      name: "Carbs",
      value: carbsCalories,
      percentage: totalMacroCalories > 0 ? (carbsCalories / totalMacroCalories) * 100 : 0,
      color: "#F4A261", // macscore-gold
      calories: carbsCalories,
      grams: nutrition.carbs,
    },
    {
      name: "Fat",
      value: fatCalories,
      percentage: totalMacroCalories > 0 ? (fatCalories / totalMacroCalories) * 100 : 0,
      color: "#f97316", // orange-500 (matching NutritionBars)
      calories: fatCalories,
      grams: nutrition.fat,
    },
  ].filter((item) => item.value > 0); // Only show macros that have values

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.percentage.toFixed(1)}% of calories
          </p>
          <p className="text-sm text-gray-600">
            {data.grams.toFixed(1)}g ({data.calories.toFixed(0)} kcal)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const dataItem = data.find((d) => d.name === entry.value);
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.value}</span>
              <span className="text-sm font-semibold text-gray-900">
                {dataItem?.percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // If no macros, show empty state
  if (data.length === 0 || totalMacroCalories === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-64 text-gray-400",
          className
        )}
      >
        <p className="text-sm">No macronutrient data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={0}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            label={(props: any) => {
              const { cx, cy, midAngle, innerRadius = 0, outerRadius: radius, percent } = props;
              if (percent < 0.05) return null; // Don't show label for very small slices
              const RADIAN = Math.PI / 180;
              const radiusLabel = innerRadius + (radius - innerRadius) * 0.65;
              const x = cx + radiusLabel * Math.cos(-midAngle * RADIAN);
              const y = cy + radiusLabel * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs sm:text-sm font-bold pointer-events-none"
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.7), 0 -1px 2px rgba(0,0,0,0.7), 1px 0 2px rgba(0,0,0,0.7), -1px 0 2px rgba(0,0,0,0.7)",
                  }}
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderCustomLegend} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-xs text-gray-500">
        <p className="text-xs sm:text-sm">
          Macronutrients: {totalMacroCalories.toFixed(0)} kcal
          {Math.abs(nutrition.calories - totalMacroCalories) > 1 && (
            <span className="ml-1">
              (Total: {nutrition.calories.toFixed(0)} kcal)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
