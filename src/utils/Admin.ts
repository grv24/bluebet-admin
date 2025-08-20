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
