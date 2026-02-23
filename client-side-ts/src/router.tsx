import { createBrowserRouter, Outlet } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/home";
import { Events } from "./pages/events";
import { Organizations } from "./pages/organizations";
import { Resources } from "./pages/home/sections/Resources";
import { Shop } from "./pages/orders/components/Shop";
import { ProductDetailsPage } from "./pages/orders/components/ProductDetails";
import { Cart } from "./pages/orders/components/Cart";
import OTPCode from "./pages/auth/OtpCode";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfCondition } from "./pages/TermsOfCondition";
import EventManagement from "./pages/admin/EventManagement";
import { ErrorPage } from "./pages/ErrorPage";
import { UnderConstruction } from "./pages/UnderConstruction";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import SetNewPassword from "./pages/auth/SetNewPassword";
import AccountSettings from "./pages/student/AccountSettings";
import EventAttendance from "./pages/student/EventAttendance";
import MyOrders from "./pages/student/MyOrders";
import StudentLayout from "./layouts/StudentLayout";
import { AdminRouteGuard } from "./components/common/RouteGuards";
import { AdminCampusRouteGuard } from "./components/common/AdminCampusRouteGuard";
import { StudentCampusRouteGuard } from "./components/common/StudentCampusRouteGuard";
import { MainCampusFinancePage } from "./pages/admin/MainCampusFinancePage";
import GeneralStudentPage from "./pages/student/GeneralStudentPage";
import GeneralAdminPage from "./pages/admin/GeneralAdminPage";
import MainCampusStudentPage from "./pages/student/MainCampusStudentPage";
import EventsPage from "./pages/admin/EventsPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Outlet,
    ErrorBoundary: ErrorPage,
    children: [
      // Public / Student / Landing Routes
      {
        Component: MainLayout,
        children: [
          { index: true, Component: Home },
          { path: "events", Component: Events },
          { path: "organizations", Component: Organizations },
          { path: "resources", Component: Resources },
          { path: "shop", Component: Shop },
          { path: "shop/:id", Component: ProductDetailsPage },
          { path: "cart", Component: Cart },
          {
            path: "student",
            Component: StudentLayout,
            children: [
              { index: true, Component: AccountSettings },
              { path: "event-attendance", Component: EventAttendance },
              { path: "my-orders", Component: MyOrders },
              { path: "account-settings", Component: AccountSettings },
              // TODO: Remove this sample
              // Example of a general student page with campus-specific component
              { path: "general", Component: GeneralStudentPage },
              // TODO: Remove this sample
              // Example of a campus-specific student route
              {
                path: "main-campus",
                element: (
                  <StudentCampusRouteGuard allowedCampuses={["UC-Main"]} />
                ),
                children: [{ index: true, Component: MainCampusStudentPage }],
              },
            ],
          },
        ],
      },
      // Static Pages (No Header/Footer)
      { path: "privacy", Component: PrivacyPolicy },
      { path: "terms", Component: TermsOfCondition },
      // Authentication Routes
      {
        path: "auth",
        children: [
          { path: "login", Component: Login },
          { path: "signup", Component: Signup },
          { path: "forgot-password", Component: ForgotPassword },
          { path: "otp", Component: OTPCode },
          { path: "reset-password", Component: SetNewPassword },
        ],
      },
      // Admin Routes
      {
        path: "admin",
        Component: AdminRouteGuard,
        children: [
          {
            path: "under-construction",
            Component: UnderConstruction,
          },
          {
            Component: AdminLayout,
            children: [
              // { path: "dashboard", Component: Dashboard },
              { path: "events", Component: EventsPage },
              { path: "events/:eventId", Component: EventManagement },
              // TODO: Remove this sample
              // Example of a general admin page with campus-specific component
              { path: "general", Component: GeneralAdminPage },
            ],
          },
          // TODO: Remove this sample
          // Example of a campus-specific route
          {
            path: "finances",
            element: <AdminCampusRouteGuard allowedCampuses={["UC-Main"]} />,
            children: [{ index: true, Component: MainCampusFinancePage }],
          },
        ],
      },
    ],
  },
]);

export default router;
