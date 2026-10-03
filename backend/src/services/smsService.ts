import User from '../models/User';

export interface SMSDispatchResult {
  success: boolean;
  recipientCount: number;
  targetDistrict: string;
  phoneNumbers: string[];
  message: string;
  error?: any;
}

/**
 * Dispatches emergency atmospheric alert SMS to citizens in a target district/region.
 * @param targetDistrict The target region/district name, or 'All' / 'All Regions' for nationwide alerts.
 * @param alertTitle The title of the disaster/atmospheric alert.
 * @param alertMessage The emergency message instructions.
 */
export const sendRegionalSMSAlert = async (
  targetDistrict: string = 'All Regions',
  alertTitle: string = '',
  alertMessage: string = '',
  targetState: string = 'All States',
  targetCountry: string = 'India'
): Promise<SMSDispatchResult> => {
  try {
    const isSpecificDistrict = Boolean(
      targetDistrict &&
      targetDistrict !== 'All' &&
      targetDistrict !== 'All Regions' &&
      !targetDistrict.toLowerCase().startsWith('select')
    );

    const isSpecificState = Boolean(
      targetState &&
      targetState !== 'All' &&
      targetState !== 'All States' &&
      !targetState.toLowerCase().startsWith('select')
    );

    const isSpecificCountry = Boolean(
      targetCountry &&
      targetCountry !== 'All' &&
      targetCountry !== 'All Countries' &&
      !targetCountry.toLowerCase().startsWith('select')
    );

    // Base query: users with registered phone numbers
    const query: any = {
      phone: { $exists: true, $ne: '' }
    };

    let scopeLabel = '';

    if (isSpecificState && isSpecificDistrict) {
      // 🎯 Scenario 3: District Level Alert (e.g. State: Gujarat, District: Kutch / Ahmedabad)
      // Only users belonging to the specific district receive the alert.
      const stateRegex = new RegExp(targetState.trim(), 'i');
      const districtRegex = new RegExp(targetDistrict.trim(), 'i');

      query.$and = [
        { $or: [{ state: stateRegex }, { 'location.address': stateRegex }] },
        { $or: [{ district: districtRegex }, { 'location.address': districtRegex }] }
      ];

      if (isSpecificCountry) {
        const countryRegex = new RegExp(targetCountry.trim(), 'i');
        query.$and.push({ $or: [{ country: countryRegex }, { 'location.address': countryRegex }] });
      }

      scopeLabel = `District Level: ${targetDistrict} (${targetState}${isSpecificCountry ? `, ${targetCountry}` : ''})`;
    } else if (isSpecificDistrict) {
      // Direct District match
      const districtRegex = new RegExp(targetDistrict.trim(), 'i');
      query.$or = [
        { district: districtRegex },
        { 'location.address': districtRegex }
      ];
      scopeLabel = `District Level: ${targetDistrict}`;
    } else if (isSpecificState) {
      // 🏛️ Scenario 2: State Level Alert (e.g. State: Gujarat, District: Select / All)
      // Only users belonging to Gujarat state receive the alert. Users from Maharashtra, Rajasthan, etc. DO NOT.
      const stateRegex = new RegExp(targetState.trim(), 'i');

      query.$or = [
        { state: stateRegex },
        { 'location.address': stateRegex }
      ];

      if (isSpecificCountry) {
        const countryRegex = new RegExp(targetCountry.trim(), 'i');
        query.$and = [
          { $or: [{ country: countryRegex }, { 'location.address': countryRegex }] },
          { $or: [{ state: stateRegex }, { 'location.address': stateRegex }] }
        ];
      }

      scopeLabel = `State Level: ${targetState}${isSpecificCountry ? ` (${targetCountry})` : ''}`;
    } else if (isSpecificCountry) {
      // 🇮🇳 Scenario 1: Country Level Alert (e.g. Country: India, State: Select / All, District: Select / All)
      // Send alert notification to all registered users across India.
      const countryRegex = new RegExp(targetCountry.trim(), 'i');

      query.$or = [
        { country: countryRegex },
        { 'location.address': countryRegex }
      ];
      scopeLabel = `Country Level: ${targetCountry}`;
    } else {
      // Nationwide / All Regions Alert (Default fallback when no specific filters selected)
      scopeLabel = `Nationwide / All Regions Broadcast`;
    }

    // Find matching users with registered mobile phone numbers
    const recipients = await User.find(query).select('phone name country state district role location');
    const phoneNumbers = recipients.map(u => u.phone).filter(Boolean);

    const smsText = `[SAFESPHERE - ${scopeLabel.toUpperCase()}] 🚨 ${alertTitle.toUpperCase()}: ${alertMessage}`;

    return {
      success: true,
      recipientCount: phoneNumbers.length,
      targetDistrict: isSpecificDistrict ? targetDistrict : (isSpecificState ? targetState : targetCountry),
      phoneNumbers,
      message: smsText
    };
  } catch (error) {
    return {
      success: false,
      recipientCount: 0,
      targetDistrict,
      phoneNumbers: [],
      message: alertMessage,
      error
    };
  }
};
