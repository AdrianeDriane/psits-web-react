import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { InfinitySpin } from "react-loader-spinner";

import { useAuth } from "@/features/auth";
import type { StudentProfile } from "@/features/student";
import { getStudentProfileV2 } from "@/features/student";

export const Field: React.FC<{ label: string; value?: string | number }> = ({
  label,
  value,
}) => (
  <div>
    <Label className="text-sm font-medium text-slate-700">{label}</Label>
    <Input
      value={value || ""}
      disabled
      className="mt-1.5 border-slate-200 bg-slate-50 text-slate-600"
    />
  </div>
);
export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.idNumber) return;
      try {
        setLoading(true);
        const data = await getStudentProfileV2(user.idNumber);
        setStudentData(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.idNumber]);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <InfinitySpin width="150" color="#0d6efd" />
      </div>
    );
  }
  const displayData = studentData || (user as unknown as StudentProfile);
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Account Settings</h2>

      <div className="mx-auto max-w-screen-xl">
        <Card className="rounded-2xl p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-medium">Personal Information</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Your full student profile details.
              </p>
            </div>
            {displayData?.campus && (
              <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                {displayData.campus}
              </div>
            )}
          </div>

          <CardContent className="grid grid-cols-1 gap-6 p-0 md:grid-cols-2">
            <Field label="ID Number" value={displayData?.id_number} />
            <Field label="First Name" value={displayData?.first_name} />
            <Field label="Last Name" value={displayData?.last_name} />
            <Field label="Course" value={displayData?.course} />
            <Field label="Year Level" value={displayData?.year} />

            <div className="md:col-span-2">
              <Field label="Email Address" value={displayData?.email} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
