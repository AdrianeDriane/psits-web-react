import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DistributionData } from "@/features/events/types/event.types";

interface CourseDistributionChartProps {
  data: DistributionData;
}

const COURSE_COLORS = [
  "#8979FF",
  "#FF928A",
  "#3CC3DF",
  "#FFAE4C",
  "#F472B6",
  "#34D399",
];

export const CourseDistributionChart: React.FC<
  CourseDistributionChartProps
> = ({ data }) => {
  const chartData = Object.entries(data.registered).map(([key, value]) => ({
    name: key,
    value,
  }));

  const hasData = chartData.some((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Course Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COURSE_COLORS[index % COURSE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">No course data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
