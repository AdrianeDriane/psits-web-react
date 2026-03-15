import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { YearLevelDistributionData } from "@/features/events/types/event.types";

interface YearLevelDistributionChartProps {
  data: YearLevelDistributionData;
}

const YEAR_COLORS = ["#0E4A67", "#1E7AA8", "#2E9AD1", "#8ABFDB"];

const YEAR_LABELS: Record<string, string> = {
  "1st": "1st Year",
  "2nd": "2nd Year",
  "3rd": "3rd Year",
  "4th": "4th Year",
};

export const YearLevelDistributionChart: React.FC<
  YearLevelDistributionChartProps
> = ({ data }) => {
  const chartData = Object.entries(data.registered).map(
    ([key, value], index) => ({
      name: YEAR_LABELS[key] || key,
      value,
      attended: data.attended[key as keyof typeof data.attended] || 0,
      color: YEAR_COLORS[index % YEAR_COLORS.length],
    })
  );

  const totalRegistered = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = chartData.some((d) => d.value > 0);

  return (
    <Card className="rounded-3xl border border-slate-200/80 bg-white/90 pt-5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <GraduationCap className="h-4 w-4 text-[#0E4A67]" />
            Registered Students
          </CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            Year Level
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,1.1fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-4xl leading-none font-semibold text-slate-800">
                {totalRegistered.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-sm">
                Total Registered Students
              </p>
            </div>
            <div className="space-y-2">
              {chartData.map((entry) => (
                <div
                  key={entry.name}
                  className="bg-muted/50 flex items-center justify-between rounded-full px-3 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-700">{entry.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {entry.value.toLocaleString()}
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
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={95}
                    dataKey="value"
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    formatter={(value: number | string, _name, item) => {
                      const payload = item?.payload as {
                        attended?: number;
                      };
                      return [
                        `${Number(value).toLocaleString()} registered (${(payload.attended || 0).toLocaleString()} attended)`,
                      ];
                    }}
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
                  No registration data
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
