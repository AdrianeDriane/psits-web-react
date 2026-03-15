import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CampusBreakdownEntry } from "@/features/events/types/event.types";

interface CampusRevenueCardsProps {
  campusBreakdown: CampusBreakdownEntry[];
}

const CAMPUS_THEME: Record<string, { bg: string; hover: string }> = {
  "UC-Main": { bg: "bg-[#002366]", hover: "hover:bg-[#001a4d]" },
  "UC-Banilad": { bg: "bg-[#008000]", hover: "hover:bg-[#006400]" },
  "UC-LM": { bg: "bg-[#800080]", hover: "hover:bg-[#660066]" },
  "UC-PT": { bg: "bg-[#B8860B]", hover: "hover:bg-[#996F0B]" },
  "UC-CS": { bg: "bg-[#D2691E]", hover: "hover:bg-[#A0522D]" },
};

const DEFAULT_THEME = { bg: "bg-gray-600", hover: "hover:bg-gray-700" };

export const CampusRevenueCards: React.FC<CampusRevenueCardsProps> = ({
  campusBreakdown,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Campus Revenue & Sales</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {campusBreakdown.map((entry) => {
          const theme = CAMPUS_THEME[entry.campus] || DEFAULT_THEME;
          const displayName =
            entry.campus === "UC-CS" ? "UC-Main CS" : entry.campus;

          return (
            <Card
              key={entry.campus}
              className={`${theme.bg} ${theme.hover} border-0 transition-colors duration-200`}
            >
              <CardContent className="p-5 text-center text-white">
                <h4 className="mb-3 text-sm font-medium opacity-90">
                  {displayName}
                </h4>
                <div className="space-y-1">
                  <p className="text-sm">
                    Registrations:{" "}
                    <span className="font-bold">{entry.registrations}</span>
                  </p>
                  <p className="text-sm">
                    Units Sold:{" "}
                    <span className="font-bold">{entry.unitsSold}</span>
                  </p>
                  <p className="text-sm">
                    Revenue:{" "}
                    <span className="font-bold">
                      ₱{entry.revenue.toLocaleString()}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
