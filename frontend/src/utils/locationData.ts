import { Country, State, City } from 'country-state-city';

/**
 * Returns list of country names, with 'Select Country' placeholder at top, followed by 'India'.
 */
export const getCountries = (placeholder: string = 'Select Country'): string[] => {
  const allCountries = Country.getAllCountries();
  const countryNames = allCountries.map(c => c.name);
  
  const indiaIndex = countryNames.indexOf('India');
  if (indiaIndex > -1) {
    countryNames.splice(indiaIndex, 1);
    return [placeholder, 'India', ...countryNames];
  }
  return [placeholder, ...countryNames];
};

/**
 * Returns list of states for a given country name, with placeholder at top.
 */
export const getStatesForCountry = (countryName: string, placeholder: string = 'Select State'): string[] => {
  if (!countryName || countryName.startsWith('Select') || countryName === 'All Countries') {
    const indiaStates = State.getStatesOfCountry('IN').map(s => s.name);
    return [placeholder, ...indiaStates];
  }

  const countryObj = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );

  if (!countryObj) {
    const defaultStates = State.getStatesOfCountry('IN').map(s => s.name);
    return [placeholder, ...defaultStates];
  }

  const states = State.getStatesOfCountry(countryObj.isoCode).map(s => s.name);
  const uniqueStates = Array.from(new Set(states));

  return [placeholder, ...uniqueStates];
};

/**
 * Returns list of cities/districts for a given country and state name, with placeholder at top.
 */
export const getDistrictsForState = (
  countryName: string,
  stateName: string,
  placeholder: string = 'Select District / Region'
): string[] => {
  if (!countryName || countryName.startsWith('Select') || countryName === 'All Countries') {
    countryName = 'India';
  }

  const countryObj = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  ) || Country.getAllCountries().find(c => c.isoCode === 'IN');

  if (!countryObj) {
    return [placeholder];
  }

  if (!stateName || stateName.startsWith('Select') || stateName === 'All States') {
    const defaultCities = City.getCitiesOfState(countryObj.isoCode, 'GJ').map(c => c.name);
    const uniqueCities = Array.from(new Set(defaultCities));
    return [placeholder, ...uniqueCities];
  }

  const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
    s => s.name.toLowerCase() === stateName.toLowerCase()
  );

  if (!stateObj) {
    return [placeholder];
  }

  const cities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode).map(c => c.name);
  const uniqueCities = Array.from(new Set(cities));

  return [placeholder, ...uniqueCities];
};

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

  if (!countryName || countryName.toLowerCase().startsWith('select')) {
    countryName = 'India';
  }

  const countryObj = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase() || c.isoCode.toLowerCase() === countryName.toLowerCase()
  ) || Country.getCountryByCode('IN');

  const cCode = countryObj ? countryObj.isoCode : 'IN';

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
