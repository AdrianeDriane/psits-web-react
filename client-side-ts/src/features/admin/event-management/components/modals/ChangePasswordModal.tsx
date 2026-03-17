import React, { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeAttendeePasswordV2 } from "@/features/events/api/eventService";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordChanged?: () => void;
  eventId: string;
  attendeeIdNumber: string;
  attendeeName: string;
}

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;
const PASSWORD_SYMBOL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
const REQUIRED_MESSAGE = "This field is required";

type FormErrors = Partial<
  Record<"newPassword" | "confirmPassword" | "adminPassword", string>
>;

const validatePassword = (value: string): string | undefined => {
  if (!value) return REQUIRED_MESSAGE;
  if (value.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (!PASSWORD_UPPERCASE_REGEX.test(value))
    return "Password must include at least 1 uppercase letter";
  if (!PASSWORD_LOWERCASE_REGEX.test(value))
    return "Password must include at least 1 lowercase letter";
  if (!PASSWORD_NUMBER_REGEX.test(value))
    return "Password must include at least 1 number";
  if (!PASSWORD_SYMBOL_REGEX.test(value))
    return "Password must include at least 1 symbol (e.g., #, -, @)";
  return undefined;
};

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onOpenChange,
  onPasswordChanged,
  eventId,
  attendeeIdNumber,
  attendeeName,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setAdminPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowAdminPassword(false);
    setErrors({});
  };

  const handleCancel = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset();
    }
    onOpenChange(nextOpen);
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const passwordError = validatePassword(newPassword);
    if (passwordError) nextErrors.newPassword = passwordError;

    if (!confirmPassword) {
      nextErrors.confirmPassword = REQUIRED_MESSAGE;
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!adminPassword.trim()) {
      nextErrors.adminPassword = "Admin password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await changeAttendeePasswordV2(eventId, attendeeIdNumber, {
        adminPassword: adminPassword.trim(),
        newPassword,
      });

      if (result) {
        onPasswordChanged?.();
        handleReset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-md sm:rounded-xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex-none border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl leading-6 font-semibold">
              Change Password
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
            {/* Attendee info */}
            <div className="rounded-xl border px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Changing password for
              </p>
              <p className="text-sm font-medium">{attendeeName}</p>
              <p className="text-muted-foreground font-mono text-xs">
                {attendeeIdNumber}
              </p>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="cpNewPassword" className="mb-2">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="cpNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      newPassword: undefined,
                    }));
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword ? (
                <p className="text-destructive mt-1 text-xs">
                  {errors.newPassword}
                </p>
              ) : (
                <p className="text-muted-foreground mt-1 text-xs">
                  Min. 8 characters with uppercase, lowercase, number & symbol
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <Label htmlFor="cpConfirmPassword" className="mb-2">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="cpConfirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }}
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

            {/* Admin Password */}
            <div>
              <Label htmlFor="cpAdminPassword" className="mb-2">
                Admin Password
              </Label>
              <div className="relative">
                <Input
                  id="cpAdminPassword"
                  type={showAdminPassword ? "text" : "password"}
                  placeholder="Enter your admin password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      adminPassword: undefined,
                    }));
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                >
                  {showAdminPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.adminPassword ? (
                <p className="text-destructive mt-1 text-xs">
                  {errors.adminPassword}
                </p>
              ) : (
                <p className="text-muted-foreground mt-1 text-xs">
                  Required for security verification
                </p>
              )}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <p className="text-xs leading-relaxed text-amber-900">
                This will change the student&apos;s login password immediately.
                Please ensure the student is informed of their new password.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-background flex flex-none items-center justify-end gap-3 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#1C9DDE] hover:bg-[#1C9DDE]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changing Password...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
