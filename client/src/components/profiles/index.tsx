import { useAuth } from "@/_core/hooks/useAuth";
import type { AppRole } from "@shared/role-visibility";
import { useOwnerView } from "@/contexts/OwnerViewContext";
import UserProfile from "./UserProfile";
import SpecialistProfile from "./SpecialistProfile";
import BusinessProfile from "./BusinessProfile";
import SupportProfile from "./SupportProfile";
import AdminProfile from "./AdminProfile";
import OwnerProfile from "./OwnerProfile";
import CriticProfile from "./CriticProfile";

/**
 * Renders the appropriate profile component based on the user's role.
 * When an owner is "viewing as" another role via the BottomNav role-switcher,
 * it renders the profile for that role instead of the OwnerProfile.
 */
export default function RoleBasedProfile() {
  const { user, loading } = useAuth();
  const { viewingAs } = useOwnerView();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const actualRole: AppRole = (user?.role as AppRole) || "user";
  // If owner is viewing as another role, use that role for profile selection
  const effectiveRole = (actualRole === "owner" && viewingAs && viewingAs !== "owner")
    ? viewingAs
    : actualRole;

  switch (effectiveRole) {
    case "user":
      return <UserProfile />;
    case "specialist":
      return <SpecialistProfile />;
    case "business":
      return <BusinessProfile />;
    case "support":
      return <SupportProfile />;
    case "admin":
      return <AdminProfile />;
    case "owner":
      return <OwnerProfile />;
    case "critic":
      return <CriticProfile />;
    default:
      return <UserProfile />;
  }
}
