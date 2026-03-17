import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DistributionData } from "@/features/events/types/event.types";

interface CampusDistributionChartProps {
  data: DistributionData;
}

const CAMPUS_COLORS = ["#0E4A67", "#1E7AA8", "#2E9AD1", "#7DB7D8", "#B8D9EC"];

export const CampusDistributionChart: React.FC<
  CampusDistributionChartProps
> = ({ data }) => {
  const chartData = Object.keys(data.registered).map((campus, index) => ({
    campus,
    label: campus.replace("UC-", "UC "),
    color: CAMPUS_COLORS[index % CAMPUS_COLORS.length],
    registered: data.registered[campus] || 0,
    attended: data.attended[campus] || 0,
  }));

  const totalRegistered = chartData.reduce(
    (total, entry) => total + entry.registered,
    0
  );
  const totalAttended = chartData.reduce(
    (total, entry) => total + entry.attended,
    0
  );
  const hasData = chartData.some((entry) => entry.registered > 0);

  return (
    <Card className="rounded-3xl border border-slate-200/80 bg-white/90 pt-5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <Building2 className="h-4 w-4 text-[#0E4A67]" />
            Registered Students
          </CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            Campus
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
              <p className="text-muted-foreground mt-1 text-xs">
                {totalAttended.toLocaleString()} attended
              </p>
            </div>

            <div className="space-y-2">
              {chartData.map((entry) => (
                <div
                  key={entry.campus}
                  className="bg-muted/50 flex items-center justify-between rounded-full px-3 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-700">
                      {entry.label}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {entry.registered.toLocaleString()}
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
                    dataKey="registered"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={95}
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.campus} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    formatter={(value: number | string) =>
                      `${Number(value).toLocaleString()} registered`
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
                <p className="text-muted-foreground text-sm">No campus data</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
