import React, { useEffect, useMemo, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/utils/alertHelper";
import type { EventMerchMeta } from "@/features/events/types/event.types";

interface AddAttendeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAttendee?: (attendee: AttendeeFormData) => void;
  eventId: string;
  adminCampus?: string;
  merch?: EventMerchMeta | null;
}

export interface AttendeeFormData {
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  campus: string;
  course: string;
  yearLevel: string;
  shirtSize: string;
  shirtPrice: string;
  password: string;
  confirmPassword: string;
}

const COURSE_OPTIONS = ["BSIT", "BSCS", "ACT"];
const YEAR_LEVEL_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const REQUIRED_MESSAGE = "This field is required";

type FormErrors = Partial<Record<keyof AttendeeFormData, string>>;

const shouldShowShirtFields = (merch?: EventMerchMeta | null): boolean => {
  if (!merch) return false;
  return merch.category === "ict-congress" && merch.type === "Tshirt w/ Bundle";
};

export const AddAttendeeModal: React.FC<AddAttendeeModalProps> = ({
  open,
  onOpenChange,
  onAddAttendee,
  eventId,
  adminCampus,
  merch,
}) => {
  void onAddAttendee;
  void eventId;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AttendeeFormData>({
    studentId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    campus: "",
    course: "",
    yearLevel: "",
    shirtSize: "",
    shirtPrice: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isShirtFieldVisible = useMemo(
    () => shouldShowShirtFields(merch),
    [merch]
  );

  const shirtSizeOptions = useMemo(() => {
    if (!merch?.selectedSizes || typeof merch.selectedSizes !== "object") {
      return [];
    }
    return Object.keys(merch.selectedSizes);
  }, [merch]);

  useEffect(() => {
    if (!adminCampus) return;

    setFormData((prev) => ({
      ...prev,
      campus: adminCampus,
    }));
  }, [adminCampus]);

  useEffect(() => {
    if (!isShirtFieldVisible) {
      setFormData((prev) => ({
        ...prev,
        shirtSize: "",
        shirtPrice: "",
      }));
      return;
    }

    if (!formData.shirtSize) {
      setFormData((prev) => ({
        ...prev,
        shirtPrice: "",
      }));
      return;
    }

    const selected = merch?.selectedSizes?.[formData.shirtSize];
    const priceString = selected?.price ? String(selected.price) : "";

    setFormData((prev) => ({
      ...prev,
      shirtPrice: priceString,
    }));
  }, [formData.shirtSize, isShirtFieldVisible, merch]);

  const handleChange = (field: keyof AttendeeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!formData.studentId.trim()) {
      nextErrors.studentId = REQUIRED_MESSAGE;
    }

    if (!formData.firstName.trim()) {
      nextErrors.firstName = REQUIRED_MESSAGE;
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = REQUIRED_MESSAGE;
    }

    if (!formData.email.trim()) {
      nextErrors.email = REQUIRED_MESSAGE;
    }

    if (!formData.campus.trim()) {
      nextErrors.campus = REQUIRED_MESSAGE;
    }

    if (!formData.course.trim()) {
      nextErrors.course = REQUIRED_MESSAGE;
    }

    if (!formData.yearLevel.trim()) {
      nextErrors.yearLevel = REQUIRED_MESSAGE;
    }

    if (isShirtFieldVisible && !formData.shirtSize.trim()) {
      nextErrors.shirtSize = REQUIRED_MESSAGE;
    }

    if (!formData.password.trim()) {
      nextErrors.password = REQUIRED_MESSAGE;
    }

    if (!formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = REQUIRED_MESSAGE;
    }

    if (
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password !== formData.confirmPassword
    ) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      showToast("error", "Please complete required fields.");
      return;
    }

    setIsLoading(true);
    try {
      showToast("error", "Submit is temporarily disabled.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      campus: adminCampus ?? "",
      course: "",
      yearLevel: "",
      shirtSize: "",
      shirtPrice: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCancel = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-2xl sm:rounded-xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex-none border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl leading-6 font-semibold">
              Add Attendee
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCancel}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Student ID Number */}
            <div>
              <Label htmlFor="studentId" className="mb-2">
                Student ID Number
              </Label>
              <Input
                id="studentId"
                placeholder="Enter student ID number"
                value={formData.studentId}
                onChange={(e) => handleChange("studentId", e.target.value)}
              />
              {errors.studentId ? (
                <p className="text-destructive mt-1 text-xs">
                  {errors.studentId}
                </p>
              ) : null}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="firstName" className="mb-2">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
                {errors.firstName ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.firstName}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="middleName" className="mb-2">
                  Middle Name
                </Label>
                <Input
                  id="middleName"
                  placeholder="Enter middle name"
                  value={formData.middleName}
                  onChange={(e) => handleChange("middleName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-2">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
                {errors.lastName ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.lastName}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <Label htmlFor="email" className="mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email ? (
                <p className="text-destructive mt-1 text-xs">{errors.email}</p>
              ) : null}
            </div>

            {/* Campus, Course, Year Level */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="campus" className="mb-2">
                  Campus
                </Label>
                <Input
                  id="campus"
                  value={formData.campus}
                  disabled
                  readOnly
                  placeholder="Campus"
                />
                {errors.campus ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.campus}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="course" className="mb-2">
                  Course
                </Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => handleChange("course", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_OPTIONS.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.course ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.course}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="yearLevel" className="mb-2">
                  Year Level
                </Label>
                <Select
                  value={formData.yearLevel}
                  onValueChange={(value) => handleChange("yearLevel", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_LEVEL_OPTIONS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.yearLevel ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.yearLevel}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Shirt Size and Price */}
            {isShirtFieldVisible ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="shirtSize" className="mb-2">
                    Shirt Size
                  </Label>
                  <Select
                    value={formData.shirtSize}
                    onValueChange={(value) => handleChange("shirtSize", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {shirtSizeOptions.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shirtSize ? (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.shirtSize}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="shirtPrice" className="mb-2">
                    Shirt Price
                  </Label>
                  <div className="relative">
                    <Input
                      id="shirtPrice"
                      type="number"
                      placeholder="Price"
                      value={formData.shirtPrice}
                      className="pr-12"
                      disabled
                      readOnly
                    />
                    <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium">
                      PHP
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="password" className="mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.password}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="mb-2">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword ? (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.confirmPassword}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-background flex flex-none items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#1C9DDE] hover:bg-[#1C9DDE]"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Attendee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
