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
import { Activity } from "lucide-react";
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
    <Card className="rounded-3xl border border-slate-200/80 bg-white/90 pt-5 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Activity className="h-4 w-4 text-[#0E4A67]" />
          Registration Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
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
                    <stop offset="5%" stopColor="#1E7AA8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1E7AA8" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "13px",
                    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.12)",
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
                  stroke="#1E7AA8"
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
