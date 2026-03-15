import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionAttendanceData } from "@/features/events/types/event.types";

interface SessionAttendanceChartProps {
  data: SessionAttendanceData;
}

const SESSION_COLORS: Record<string, string> = {
  Morning: "#FFAE4C",
  Afternoon: "#1C9DDE",
  Evening: "#8979FF",
};

export const SessionAttendanceChart: React.FC<SessionAttendanceChartProps> = ({
  data,
}) => {
  const chartData = [
    { session: "Morning", count: data.morning },
    { session: "Afternoon", count: data.afternoon },
    { session: "Evening", count: data.evening },
  ];

  const hasData = chartData.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Session Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="session"
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
                <Bar dataKey="count" name="Attendees" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.session}
                      fill={SESSION_COLORS[entry.session]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No attendance data
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
