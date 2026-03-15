import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DistributionData } from "@/features/events/types/event.types";

interface CampusDistributionChartProps {
  data: DistributionData;
}

export const CampusDistributionChart: React.FC<
  CampusDistributionChartProps
> = ({ data }) => {
  const chartData = Object.keys(data.registered).map((campus) => ({
    campus: campus.replace("UC-", ""),
    registered: data.registered[campus] || 0,
    attended: data.attended[campus] || 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Campus Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="campus"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Bar
                dataKey="registered"
                name="Registered"
                fill="#1C9DDE"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="attended"
                name="Attended"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
