import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationTimelineEntry } from "@/features/events/types/event.types";

interface RegistrationTimelineChartProps {
  data: RegistrationTimelineEntry[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const RegistrationTimelineChart: React.FC<
  RegistrationTimelineChartProps
> = ({ data }) => {
  const chartData = data.map((entry) => ({
    ...entry,
    label: formatDate(entry.date),
  }));

  const hasData = chartData.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Registration Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="registrationGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1C9DDE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1C9DDE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
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
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.date) {
                      return payload[0].payload.date;
                    }
                    return "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeCount"
                  name="Total Registrations"
                  stroke="#1C9DDE"
                  strokeWidth={2}
                  fill="url(#registrationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No registration timeline data
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
