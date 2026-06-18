import { useAuth } from "@/_core/hooks/useAuth";
import type { AppRole } from "@shared/role-visibility";
import UserProfile from "./UserProfile";
import InfluencerProfile from "./InfluencerProfile";
import BusinessProfile from "./BusinessProfile";
import SupportProfile from "./SupportProfile";
import AdminProfile from "./AdminProfile";
import OwnerProfile from "./OwnerProfile";
import CriticProfile from "./CriticProfile";

/**
 * Renders the appropriate profile component based on the user's role
 */
export default function RoleBasedProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role: AppRole = (user?.role as AppRole) || "user";

  switch (role) {
    case "influencer":
      return <InfluencerProfile />;
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
