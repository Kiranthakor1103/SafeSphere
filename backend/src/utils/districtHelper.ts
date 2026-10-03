import { Country, State, City } from 'country-state-city';

export interface DistrictInfo {
  uniqueId: string;
  districtName: string;
  stateName: string;
  stateCode: string;
  countryName: string;
  countryCode: string;
}

/**
 * Standardize text into a clean uppercase code slug (e.g., "New Delhi" -> "NEW-DELHI")
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generates a deterministic Unique District Identifier (e.g. IN-GJ-AHMEDABAD)
 */
export const generateDistrictCode = (
  countryName: string = 'India',
  stateName: string = 'Gujarat',
  districtName: string = ''
): string => {
  if (!districtName || districtName.toLowerCase().startsWith('select')) {
    return '';
  }

  // Handle defaults
  if (!countryName || countryName.toLowerCase().startsWith('select')) {
    countryName = 'India';
  }

  // Resolve Country ISO code
  const countryObj = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase() || c.isoCode.toLowerCase() === countryName.toLowerCase()
  ) || Country.getCountryByCode('IN');

  const cCode = countryObj ? countryObj.isoCode : 'IN';

  // Resolve State ISO code
  let sCode = 'GJ';
  if (stateName && !stateName.toLowerCase().startsWith('select')) {
    const states = State.getStatesOfCountry(cCode);
    const matchedState = states.find(
      s => s.name.toLowerCase() === stateName.toLowerCase() || s.isoCode.toLowerCase() === stateName.toLowerCase()
    );
    if (matchedState) {
      sCode = matchedState.isoCode;
    } else {
      sCode = slugify(stateName).slice(0, 3);
    }
  }

  const dSlug = slugify(districtName);

  return `${cCode}-${sCode}-${dSlug}`;
};

/**
 * Parses or extracts DistrictInfo from names or unique ID
 */
export const getDistrictInfo = (
  countryName: string = 'India',
  stateName: string = 'Gujarat',
  districtName: string = ''
): DistrictInfo => {
  const uniqueId = generateDistrictCode(countryName, stateName, districtName);
  return {
    uniqueId,
    districtName: districtName.trim(),
    stateName: stateName.trim(),
    stateCode: uniqueId.split('-')[1] || '',
    countryName: countryName.trim(),
    countryCode: uniqueId.split('-')[0] || 'IN'
  };
};

/**
 * Gets list of all districts for a given Country and State with their unique IDs
 */
export const getDistrictsWithUniqueIds = (
  countryName: string = 'India',
  stateName: string = 'Gujarat'
): DistrictInfo[] => {
  const cObj = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase() || c.isoCode.toLowerCase() === countryName.toLowerCase()
  ) || Country.getCountryByCode('IN');

  if (!cObj) return [];

  const states = State.getStatesOfCountry(cObj.isoCode);
  const matchedState = states.find(
    s => s.name.toLowerCase() === stateName.toLowerCase() || s.isoCode.toLowerCase() === stateName.toLowerCase()
  );

  if (!matchedState) return [];

  const cities = City.getCitiesOfState(cObj.isoCode, matchedState.isoCode);
  const uniqueCities = Array.from(new Set(cities.map(c => c.name)));

  return uniqueCities.map(cityName => ({
    uniqueId: `${cObj.isoCode}-${matchedState.isoCode}-${slugify(cityName)}`,
    districtName: cityName,
    stateName: matchedState.name,
    stateCode: matchedState.isoCode,
    countryName: cObj.name,
    countryCode: cObj.isoCode
  }));
};
