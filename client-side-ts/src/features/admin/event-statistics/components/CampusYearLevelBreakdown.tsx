import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampusBreakdownEntry } from "@/features/events/types/event.types";

interface CampusYearLevelBreakdownProps {
  campusBreakdown: CampusBreakdownEntry[];
}

const YEAR_COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"];

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const CampusYearLevelBreakdown: React.FC<
  CampusYearLevelBreakdownProps
> = ({ campusBreakdown }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Registrations by Campus & Year Level
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {campusBreakdown.map((entry) => {
          const displayName =
            entry.campus === "UC-CS" ? "UC-Main CS" : entry.campus;
          const chartData = [
            {
              year: "1st",
              count: entry.yearLevelDistribution["1st"],
            },
            {
              year: "2nd",
              count: entry.yearLevelDistribution["2nd"],
            },
            {
              year: "3rd",
              count: entry.yearLevelDistribution["3rd"],
            },
            {
              year: "4th",
              count: entry.yearLevelDistribution["4th"],
            },
          ];

          return (
            <Card key={entry.campus}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={(_, index) => YEAR_LABELS[index] || _}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                        labelFormatter={(_, payload) => {
                          const index = chartData.findIndex(
                            (d) => d.year === payload?.[0]?.payload?.year
                          );
                          return YEAR_LABELS[index] || "";
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Students"
                        radius={[4, 4, 0, 0]}
                      >
                        {chartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={YEAR_COLORS[index % YEAR_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
