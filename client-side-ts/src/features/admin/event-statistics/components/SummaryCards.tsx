import React from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatisticsSummary } from "@/features/events/types/event.types";

interface SummaryCardsProps {
  summary: StatisticsSummary;
}

const cards = [
  {
    key: "totalRegistrations",
    label: "Total Registered",
    icon: Users,
    color: "text-[#0E4A67]",
    bgColor: "bg-[#E9F4FB]",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: DollarSign,
    color: "text-[#1E7AA8]",
    bgColor: "bg-[#E8F3F9]",
    format: (v: number) => `₱${v.toLocaleString()}`,
  },
  {
    key: "attendanceRate",
    label: "Attendance Rate",
    icon: TrendingUp,
    color: "text-[#2E9AD1]",
    bgColor: "bg-[#EAF5FB]",
    format: (v: number) => `${v}%`,
  },
  {
    key: "totalAttended",
    label: "Student Attendees",
    icon: UserCheck,
    color: "text-[#7DB7D8]",
    bgColor: "bg-[#EDF6FB]",
    format: (v: number) => v.toLocaleString(),
  },
] as const;

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(
        ({ key, label, icon: Icon, color, bgColor, format }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card className="max-h-28 rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${bgColor}`}
                >
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="min-w-0 justify-evenly">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {format(summary[key] as number)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      )}
    </div>
  );
};
