import { getUserTypeFromToken } from "@/helper/auth";
import { AuthCookies } from "@/helper/auth";

interface AdminType {
  name: string;
  allowedTypes?: string[];
}

export const AdminList: AdminType[] = [
  {
    name: "TechAdmin",
    allowedTypes: [
      "Admin",
      "MiniAdmin",
      "SuperMaster",
      "Master",
      "SuperAgent",
      "Agent",
      "Client",
    ],
  },
  {
    name: "Admin",
    allowedTypes: [
      "MiniAdmin",
      "SuperMaster",
      "Master",
      "SuperAgent",
      "Agent",
      "Client",
    ],
  },
  {
    name: "MiniAdmin",
    allowedTypes: [
      "SuperMaster",
      "Master",
      "SuperAgent",
      "Agent",
      "Client",
    ],
  },
  {
    name: "SuperMaster",
    allowedTypes: [ "Master", "SuperAgent", "Agent", "Client"],
  },
  {
    name: "Master",
    allowedTypes: [ "SuperAgent", "Agent", "Client"],
  },
  {
    name: "SuperAgent",
    allowedTypes: [ "Agent", "Client"],
  },
  {
    name: "Agent",
    allowedTypes: [ "Client"],
  },
  {
    name: "Client",
    allowedTypes: ["Client"],
  },
];

// Helper function to get allowed user types for current user
export const getAllowedUserTypes = (cookies: AuthCookies): string[] => {
  const userType = getUserTypeFromToken(cookies);
  if (!userType) return [];
  
  const adminConfig = AdminList.find(admin => 
    admin.name.toLowerCase() === userType.toLowerCase()
  );
  
  return adminConfig?.allowedTypes || [];
};
