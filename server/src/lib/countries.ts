export interface CountryDetail {
  currencyCode: string;
  currencyName: string;
  language: string;
  powerPlug: string;
  emergencyNumber: string;
  transportTip: string;
  weatherTip: string;
  subregion: string;
}

export const COUNTRY_DATABASE: Record<string, CountryDetail> = {
  japan: {
    currencyCode: "JPY",
    currencyName: "Japanese Yen",
    language: "Japanese",
    powerPlug: "Type A (100V, 50/60Hz)",
    emergencyNumber: "110 / 119",
    transportTip: "Get a Suica or Pasmo card for trains and buses.",
    weatherTip: "Summers are hot and humid; winters are mild but dry.",
    subregion: "Eastern Asia"
  },
  switzerland: {
    currencyCode: "CHF",
    currencyName: "Swiss Franc",
    language: "German, French, Italian",
    powerPlug: "Type J (230V, 50Hz)",
    emergencyNumber: "112 / 117",
    transportTip: "Validate train tickets or get a Swiss Travel Pass.",
    weatherTip: "Alpine climate — layer up for changing elevations.",
    subregion: "Western Europe"
  },
  france: {
    currencyCode: "EUR",
    currencyName: "Euro",
    language: "French",
    powerPlug: "Type C / E / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "The Metro is fast and covers most of Paris.",
    weatherTip: "Expect mild weather with occasional rain year-round.",
    subregion: "Western Europe"
  },
  germany: {
    currencyCode: "EUR",
    currencyName: "Euro",
    language: "German",
    powerPlug: "Type C / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Trains are punctual — validate tickets before boarding.",
    weatherTip: "Winters are cold; summers are mild and pleasant.",
    subregion: "Western Europe"
  },
  italy: {
    currencyCode: "EUR",
    currencyName: "Euro",
    language: "Italian",
    powerPlug: "Type C / F / L (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Validate train tickets at the platform machines.",
    weatherTip: "Summers are hot, especially in the south.",
    subregion: "Southern Europe"
  },
  spain: {
    currencyCode: "EUR",
    currencyName: "Euro",
    language: "Spanish",
    powerPlug: "Type C / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Metro systems in Madrid and Barcelona are efficient.",
    weatherTip: "Summers can be very hot, particularly inland.",
    subregion: "Southern Europe"
  },
  "united kingdom": {
    currencyCode: "GBP",
    currencyName: "British Pound",
    language: "English",
    powerPlug: "Type G (230V, 50Hz)",
    emergencyNumber: "999 / 112",
    transportTip: "An Oyster card covers the Tube, buses, and rail.",
    weatherTip: "Pack layers — weather can change within the same day.",
    subregion: "Northern Europe"
  },
  "united states": {
    currencyCode: "USD",
    currencyName: "US Dollar",
    language: "English",
    powerPlug: "Type A / B (120V, 60Hz)",
    emergencyNumber: "911",
    transportTip: "Ride-share apps are widely available in most cities.",
    weatherTip: "Climate varies drastically by region and season.",
    subregion: "North America"
  },
  canada: {
    currencyCode: "CAD",
    currencyName: "Canadian Dollar",
    language: "English, French",
    powerPlug: "Type A / B (120V, 60Hz)",
    emergencyNumber: "911",
    transportTip: "Public transit is reliable; hire a car for remote spots.",
    weatherTip: "Winters are extremely cold; summers are mild.",
    subregion: "North America"
  },
  australia: {
    currencyCode: "AUD",
    currencyName: "Australian Dollar",
    language: "English",
    powerPlug: "Type I (230V, 50Hz)",
    emergencyNumber: "000",
    transportTip: "Get local Opal (Sydney) or Myki (Melbourne) transit cards.",
    weatherTip: "Seasons are reversed compared to the Northern Hemisphere.",
    subregion: "Oceania"
  },
  india: {
    currencyCode: "INR",
    currencyName: "Indian Rupee",
    language: "Hindi, English",
    powerPlug: "Type C / D / M (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Use app-based rideshares or metro in major cities.",
    weatherTip: "Monsoon season (June–September) brings heavy rain.",
    subregion: "Southern Asia"
  },
  china: {
    currencyCode: "CNY",
    currencyName: "Chinese Yuan",
    language: "Mandarin",
    powerPlug: "Type A / C / I (230V, 50Hz)",
    emergencyNumber: "110",
    transportTip: "High-speed rail connects most major cities.",
    weatherTip: "Weather varies widely between northern and southern regions.",
    subregion: "Eastern Asia"
  },
  singapore: {
    currencyCode: "SGD",
    currencyName: "Singapore Dollar",
    language: "English, Malay, Mandarin",
    powerPlug: "Type G (230V, 50Hz)",
    emergencyNumber: "999 / 995",
    transportTip: "The MRT covers nearly the entire city efficiently.",
    weatherTip: "Hot and humid year-round with frequent short showers.",
    subregion: "Southeast Asia"
  },
  thailand: {
    currencyCode: "THB",
    currencyName: "Thai Baht",
    language: "Thai",
    powerPlug: "Type A / B / C (220V, 50Hz)",
    emergencyNumber: "191",
    transportTip: "Tuk-tuks and the BTS Skytrain are common in Bangkok.",
    weatherTip: "Hot and humid most of the year; rainy season is May–October.",
    subregion: "Southeast Asia"
  },
  portugal: {
    currencyCode: "EUR",
    currencyName: "Euro",
    language: "Portuguese",
    powerPlug: "Type C / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Walk, use historic trams, or call local rideshares.",
    weatherTip: "Mild winters and hot, dry summers in most regions.",
    subregion: "Southern Europe"
  },
  mexico: {
    currencyCode: "MXN",
    currencyName: "Mexican Peso",
    language: "Spanish",
    powerPlug: "Type A / B (127V, 60Hz)",
    emergencyNumber: "911",
    transportTip: "Use registered taxis or rideshare apps for safety.",
    weatherTip: "Coastal areas are hot and humid; inland cities are milder.",
    subregion: "Central America"
  },
  brazil: {
    currencyCode: "BRL",
    currencyName: "Brazilian Real",
    language: "Portuguese",
    powerPlug: "Type C / N (127V/220V, 60Hz)",
    emergencyNumber: "190 / 192",
    transportTip: "Rideshare apps are reliable in most major cities.",
    weatherTip: "Tropical climate — expect heat and humidity most of the year.",
    subregion: "South America"
  },
  argentina: {
    currencyCode: "ARS",
    currencyName: "Argentine Peso",
    language: "Spanish",
    powerPlug: "Type C / I (220V, 50Hz)",
    emergencyNumber: "911",
    transportTip: "Get a SUBE card for buses and subway in Buenos Aires.",
    weatherTip: "Seasons are reversed from the Northern Hemisphere.",
    subregion: "South America"
  },
  netherlands: {
    currencyCode: "EUR",
    currencyName: "Euro",
    language: "Dutch",
    powerPlug: "Type C / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Renting a bike is often the fastest way to get around.",
    weatherTip: "Expect mild temperatures and frequent rain.",
    subregion: "Western Europe"
  },
  "united arab emirates": {
    currencyCode: "AED",
    currencyName: "UAE Dirham",
    language: "Arabic, English",
    powerPlug: "Type G (230V, 50Hz)",
    emergencyNumber: "999",
    transportTip: "The Dubai Metro is clean, cheap, and efficient.",
    weatherTip: "Extremely hot in summer; mild and pleasant in winter.",
    subregion: "Western Asia"
  },
  turkey: {
    currencyCode: "TRY",
    currencyName: "Turkish Lira",
    language: "Turkish",
    powerPlug: "Type C / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Get an Istanbulkart for public ferries and metro lines.",
    weatherTip: "Hot summers, cold and snowy winters in central areas.",
    subregion: "Western Asia"
  },
  "south korea": {
    currencyCode: "KRW",
    currencyName: "South Korean Won",
    language: "Korean",
    powerPlug: "Type C / F (220V, 60Hz)",
    emergencyNumber: "112 / 119",
    transportTip: "Get a T-money card for subways and buses.",
    weatherTip: "Summers are hot and humid; winters are cold and dry.",
    subregion: "Eastern Asia"
  },
  indonesia: {
    currencyCode: "IDR",
    currencyName: "Indonesian Rupiah",
    language: "Indonesian",
    powerPlug: "Type C / F (230V, 50Hz)",
    emergencyNumber: "112",
    transportTip: "Ride-hailing apps are the easiest way to get around.",
    weatherTip: "Tropical climate with a distinct wet season.",
    subregion: "Southeast Asia"
  }
};

const DEFAULT_COUNTRY: CountryDetail = {
  currencyCode: "USD",
  currencyName: "US Dollar",
  language: "English / Local Language",
  powerPlug: "Type C / F (Standard Europlug)",
  emergencyNumber: "112",
  transportTip: "Research local public transport options upon arrival.",
  weatherTip: "Verify regional forecasts prior to departure.",
  subregion: "Global"
};

export function lookupCountry(countryQuery: string): CountryDetail {
  if (!countryQuery) return DEFAULT_COUNTRY;
  const norm = countryQuery.toLowerCase().trim();
  
  // Direct match
  if (COUNTRY_DATABASE[norm]) {
    return COUNTRY_DATABASE[norm];
  }
  
  // Fuzzy match key in query or query in key
  for (const key in COUNTRY_DATABASE) {
    if (norm.includes(key) || key.includes(norm)) {
      return COUNTRY_DATABASE[key];
    }
  }
  
  // Sub-word & translation check
  if (norm.includes("schweiz") || norm.includes("suisse") || norm.includes("basel") || norm.includes("swiss") || norm.includes("switzerland")) {
    return COUNTRY_DATABASE["switzerland"];
  }
  if (norm.includes("japon") || norm.includes("tokyo") || norm.includes("japan")) {
    return COUNTRY_DATABASE["japan"];
  }
  if (norm.includes("uk") || norm.includes("england") || norm.includes("london") || norm.includes("britain") || norm.includes("united kingdom")) {
    return COUNTRY_DATABASE["united kingdom"];
  }
  if (norm.includes("usa") || norm.includes("america") || norm.includes("new york") || norm.includes("united states")) {
    return COUNTRY_DATABASE["united states"];
  }
  if (norm.includes("deutschland") || norm.includes("berlin") || norm.includes("germany")) {
    return COUNTRY_DATABASE["germany"];
  }
  if (norm.includes("italia") || norm.includes("rome") || norm.includes("italy")) {
    return COUNTRY_DATABASE["italy"];
  }
  if (norm.includes("españa") || norm.includes("madrid") || norm.includes("spain")) {
    return COUNTRY_DATABASE["spain"];
  }
  if (norm.includes("india") || norm.includes("delhi") || norm.includes("goa") || norm.includes("mumbai")) {
    return COUNTRY_DATABASE["india"];
  }
  if (norm.includes("france") || norm.includes("paris")) {
    return COUNTRY_DATABASE["france"];
  }
  
  return DEFAULT_COUNTRY;
}
