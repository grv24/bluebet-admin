type UserTypeCommission = {
  userId: string;
  matchCommission?: number;
  sessionCommission?: number;
};

type UserTypePartnership = {
  userId: string;
  partnership: number;
};

type Commission = {
  techAdmin?: UserTypeCommission;
  admin?: UserTypeCommission;
  miniAdmin?: UserTypeCommission;
  superMaster?: UserTypeCommission;
  master?: UserTypeCommission;
  superAgent?: UserTypeCommission;
  agent?: UserTypeCommission;
  own: number;
  total: number;
};

type Partnership = {
  techAdmin?: UserTypePartnership;
  admin?: UserTypePartnership;
  miniAdmin?: UserTypePartnership;
  superMaster?: UserTypePartnership;
  master?: UserTypePartnership;
  superAgent?: UserTypePartnership;
  agent?: UserTypePartnership;
  own: number;
  total: number;
};

interface SportSetting {
  matchCommission?: Commission;
  sessionCommission?: Commission;
  partnerShip?: Partnership;
  [key: string]: any;
}

interface SportsSettings {
  [sportName: string]: SportSetting;
}

export default function validatePanelSettings(sportsSettings: SportsSettings, userType?: string) {
  const sportNames = Object.keys(sportsSettings).filter(k => k !== 'success');

  if (sportNames.length === 0) {
    return { panelCommission: null, panelPartnership: null };
  }

  let panelCommission: { own: number; total: number } | null = null;
  let panelPartnership: { own: number; total: number } | null = null;

  // Track user type commission/partnership values across sports for consistency
  const userTypeCommissions: Record<string, Record<string, number>> = {};
  const userTypePartnerships: Record<string, Record<string, number>> = {};

  // All possible user types to check
  const userTypes = ['techAdmin', 'admin', 'miniAdmin', 'superMaster', 'master', 'superAgent', 'agent'];

  for (const sportName of sportNames) {
    const setting = sportsSettings[sportName];
    const { matchCommission, sessionCommission, partnerShip } = setting;

    // Skip if required data is missing
    if (!matchCommission || !partnerShip) {
      continue;
    }

    // Extract panel values (use "own" and "total" from the commission/partnership structure)
    const currentCommission = {
      own: matchCommission.own || 0,
      total: matchCommission.total || 0
    };

    const currentPartnership = {
      own: partnerShip.own || 0,
      total: partnerShip.total || 0
    };

    // First assignment for panel values
    if (!panelCommission) {
      panelCommission = currentCommission;
    }

    if (!panelPartnership) {
      panelPartnership = currentPartnership;
    }

    // Check consistency of panel "own" and "total" values across sports
    if (
      currentCommission.own !== panelCommission.own ||
      currentCommission.total !== panelCommission.total
    ) {
      throw new Error(
        `Panel Commission mismatch in sport: ${sportName}. Expected own: ${panelCommission.own}, total: ${panelCommission.total}, but got own: ${currentCommission.own}, total: ${currentCommission.total}`
      );
    }

    if (
      currentPartnership.own !== panelPartnership.own ||
      currentPartnership.total !== panelPartnership.total
    ) {
      throw new Error(
        `Panel Partnership mismatch in sport: ${sportName}. Expected own: ${panelPartnership.own}, total: ${panelPartnership.total}, but got own: ${currentPartnership.own}, total: ${currentPartnership.total}`
      );
    }

    // Check user type consistency across sports
    for (const userTypeKey of userTypes) {
      // Check match commission consistency
      if (matchCommission[userTypeKey as keyof Commission]) {
        const userCommission = (matchCommission[userTypeKey as keyof Commission] as UserTypeCommission).matchCommission || 0;
        
        if (!userTypeCommissions[userTypeKey]) {
          userTypeCommissions[userTypeKey] = {};
        }
        
        if (userTypeCommissions[userTypeKey][sportName] === undefined) {
          userTypeCommissions[userTypeKey][sportName] = userCommission;
        }
      }

      // Check session commission consistency (for sports like Cricket)
      if (sessionCommission && sessionCommission[userTypeKey as keyof Commission]) {
        const userSessionCommission = (sessionCommission[userTypeKey as keyof Commission] as UserTypeCommission).sessionCommission || 0;
        
        if (!userTypeCommissions[userTypeKey]) {
          userTypeCommissions[userTypeKey] = {};
        }
        
        // Store session commission with a different key to distinguish from match commission
        if (userTypeCommissions[userTypeKey][`${sportName}_session`] === undefined) {
          userTypeCommissions[userTypeKey][`${sportName}_session`] = userSessionCommission;
        }
      }

      // Check partnership consistency
      if (partnerShip[userTypeKey as keyof Partnership]) {
        const userPartnership = (partnerShip[userTypeKey as keyof Partnership] as UserTypePartnership).partnership || 0;
        
        if (!userTypePartnerships[userTypeKey]) {
          userTypePartnerships[userTypeKey] = {};
        }
        
        if (userTypePartnerships[userTypeKey][sportName] === undefined) {
          userTypePartnerships[userTypeKey][sportName] = userPartnership;
        }
      }
    }
  }

  // Validate that each user type has consistent values across all sports
  for (const userTypeKey of userTypes) {
    // Check commission consistency for this user type
    if (userTypeCommissions[userTypeKey]) {
      const commissionValues = Object.entries(userTypeCommissions[userTypeKey]);
      const matchCommissionValues = commissionValues.filter(([key]) => !key.includes('_session'));
      const sessionCommissionValues = commissionValues.filter(([key]) => key.includes('_session'));

      // Check match commission consistency
      if (matchCommissionValues.length > 1) {
        const baseValue = matchCommissionValues[0][1];
        for (const [sportName, value] of matchCommissionValues) {
          if (value !== baseValue) {
            throw new Error(
              `Match Commission inconsistency for ${userTypeKey}: ${matchCommissionValues[0][0]} has ${baseValue} but ${sportName} has ${value}. All sports should have the same commission for ${userTypeKey}.`
            );
          }
        }
      }

      // Check session commission consistency (if applicable)
      if (sessionCommissionValues.length > 1) {
        const baseValue = sessionCommissionValues[0][1];
        for (const [sportKey, value] of sessionCommissionValues) {
          if (value !== baseValue) {
            const sportName = sportKey.replace('_session', '');
            const baseSportName = sessionCommissionValues[0][0].replace('_session', '');
            throw new Error(
              `Session Commission inconsistency for ${userTypeKey}: ${baseSportName} has ${baseValue} but ${sportName} has ${value}. All sports should have the same session commission for ${userTypeKey}.`
            );
          }
        }
      }
    }

    // Check partnership consistency for this user type
    if (userTypePartnerships[userTypeKey]) {
      const partnershipValues = Object.entries(userTypePartnerships[userTypeKey]);
      if (partnershipValues.length > 1) {
        const baseValue = partnershipValues[0][1];
        for (const [sportName, value] of partnershipValues) {
          if (value !== baseValue) {
            throw new Error(
              `Partnership inconsistency for ${userTypeKey}: ${partnershipValues[0][0]} has ${baseValue} but ${sportName} has ${value}. All sports should have the same partnership for ${userTypeKey}.`
            );
          }
        }
      }
    }
  }

  return {
    panelCommission,
    panelPartnership,
  };
}
