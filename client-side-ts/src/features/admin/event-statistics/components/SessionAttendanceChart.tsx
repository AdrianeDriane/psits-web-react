import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    { session: "Morning", label: "Morning", count: data.morning },
    { session: "Afternoon", label: "Afternoon", count: data.afternoon },
    { session: "Evening", label: "Evening", count: data.evening },
  ];

  // const totalAttendees = chartData.reduce(
  //   (total, entry) => total + entry.count,
  //   0
  // );
  const hasData = chartData.some((d) => d.count > 0);

  return (
    <Card className="rounded-3xl border border-slate-200/80 bg-white/90 pt-5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <PieChartIcon className="h-4 w-4 text-[#0E4A67]" />
            Student Attendees
          </CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            Session
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,1.1fr)]">
          <div className="space-y-4">
            {/* <div>
              <p className="text-4xl leading-none font-semibold text-slate-800">
                {totalAttendees.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-sm">
                Total Student Attendees
              </p>
            </div> */}

            <div className="space-y-2">
              {chartData.map((entry) => (
                <div
                  key={entry.session}
                  className="bg-muted/50 flex items-center justify-between rounded-full px-3 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: SESSION_COLORS[entry.session] }}
                    />
                    <span className="text-sm text-slate-700">
                      {entry.label}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {entry.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[230px] md:h-[250px]">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.session}
                        fill={SESSION_COLORS[entry.session]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    formatter={(value: number | string) =>
                      `${Number(value).toLocaleString()} attendees`
                    }
                    contentStyle={{
                      borderRadius: "999px",
                      border: "0",
                      backgroundColor: "rgba(30, 41, 59, 0.92)",
                      color: "#E2E8F0",
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.22)",
                    }}
                    itemStyle={{ color: "#E2E8F0" }}
                    labelStyle={{ color: "#E2E8F0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No attendance data
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
