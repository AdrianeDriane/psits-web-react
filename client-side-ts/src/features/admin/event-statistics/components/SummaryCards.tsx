import React from "react";
import { Users, DollarSign, TrendingUp, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatisticsSummary } from "@/features/events/types/event.types";

interface SummaryCardsProps {
  summary: StatisticsSummary;
}

const cards = [
  {
    key: "totalRegistrations",
    label: "Total Registrations",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    format: (v: number) => `₱${v.toLocaleString()}`,
  },
  {
    key: "attendanceRate",
    label: "Attendance Rate",
    icon: TrendingUp,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    format: (v: number) => `${v}%`,
  },
  {
    key: "totalAttended",
    label: "Total Attended",
    icon: UserCheck,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    format: (v: number) => v.toLocaleString(),
  },
] as const;

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color, bgColor, format }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${bgColor}`}
            >
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="text-2xl font-bold">
                {format(summary[key] as number)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
