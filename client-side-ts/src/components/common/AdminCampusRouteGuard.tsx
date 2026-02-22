import ProtectedRoute from "@/components/common/ProtectedRoute";
import type { Campus } from "@/features/auth/types/auth.types";

interface CampusRouteGuardProps {
  allowedCampuses: Campus[];
}

/**
 * A route guard that requires the user to be an Admin and belong to one
 * of the specified campuses.
 *
 * @example
 * <Route Component={<AdminCampusRouteGuard allowedCampuses={["UC-Main"]} />}>
 *   <Route path="some-uc-main-page" Component={SomeUcMainPage} />
 * </Route>
 */
export function AdminCampusRouteGuard({ allowedCampuses }: CampusRouteGuardProps) {
  return (
    <ProtectedRoute
      allowedRoles={["Admin"]}
      allowedCampuses={allowedCampuses}
    />
  );
}
