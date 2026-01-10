import { Catch } from '../db/schema';

/**
 * Generate 60 realistic test catches with data concentrated in recent weeks
 * to make charts more visually interesting
 */
export function generateTestCatches(): Catch[] {
  const species = [
    'Largemouth Bass', 'Largemouth Bass', 'Largemouth Bass', 'Largemouth Bass',
    'Rainbow Trout', 'Rainbow Trout', 'Rainbow Trout',
    'Chinook Salmon', 'Chinook Salmon',
    'Channel Catfish', 'Channel Catfish',
    'Yellow Perch', 'Yellow Perch', 'Yellow Perch',
    'Northern Pike',
    'Walleye',
    'Common Carp',
    'Bluegill', 'Bluegill',
    'Black Crappie',
    'Striped Bass',
    'Brown Trout',
  ];

  const lures = [
    'Spinnerbait',
    'Crankbait',
    'Jig',
    'Soft Plastic Worm',
    'Topwater Frog',
    'Fly - Woolly Bugger',
    'Fly - Adams',
    'Live Bait - Worm',
    'Live Bait - Minnow',
    'Spoon',
    'Swimbait',
    'Drop Shot',
  ];

  const weatherConditions = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Overcast',
    'Light Rain',
    'Clear',
    'Foggy',
  ];

  const notes = [
    'Great morning bite!',
    'Caught near the fallen tree',
    'Used slow retrieve',
    'Fish was very active',
    'Perfect weather for fishing',
    'New personal best!',
    'Released safely',
    'Beautiful colors on this one',
    'Found a new honey hole',
    'Topwater strike!',
    '',
    '',
    '',
  ];

  // Bay Area fishing locations (clustered for heatmap effect)
  const locations = [
    // Hot spot 1 - Lake Merced area (many catches)
    { lat: 37.7285, lng: -122.4936, name: 'Lake Merced North' },
    { lat: 37.7265, lng: -122.4916, name: 'Lake Merced South' },
    { lat: 37.7275, lng: -122.4926, name: 'Lake Merced East' },
    // Hot spot 2 - Quarry Lakes (medium catches)
    { lat: 37.5485, lng: -122.0511, name: 'Quarry Lakes Main' },
    { lat: 37.5475, lng: -122.0501, name: 'Quarry Lakes West' },
    // Hot spot 3 - Stevens Creek (fewer catches)
    { lat: 37.4419, lng: -122.1430, name: 'Stevens Creek Reservoir' },
    // Scattered locations
    { lat: 37.8044, lng: -122.2711, name: 'Oakland Estuary' },
    { lat: 38.0324, lng: -122.1303, name: 'Martinez Marina' },
    { lat: 37.6879, lng: -122.4702, name: 'Pacifica Pier' },
  ];

  // Weight probability by location (hot spots get more catches)
  const locationWeights = [
    6, 6, 6,  // Lake Merced - high frequency
    4, 4,      // Quarry Lakes - medium
    2,         // Stevens Creek - lower
    1, 1, 1,   // Scattered - occasional
  ];

  const catches: Catch[] = [];
  const now = new Date();

  // Create catches with bias toward recent weeks
  for (let i = 0; i < 60; i++) {
    // More catches in recent weeks (exponential decay)
    // 40% in last 2 weeks, 30% in weeks 3-4, 20% in weeks 5-8, 10% older
    let daysAgo: number;
    const rand = Math.random();
    if (rand < 0.4) {
      daysAgo = Math.floor(Math.random() * 14); // Last 2 weeks
    } else if (rand < 0.7) {
      daysAgo = 14 + Math.floor(Math.random() * 14); // Weeks 3-4
    } else if (rand < 0.9) {
      daysAgo = 28 + Math.floor(Math.random() * 28); // Weeks 5-8
    } else {
      daysAgo = 56 + Math.floor(Math.random() * 120); // Older (up to ~6 months)
    }

    const catchDate = new Date(now);
    catchDate.setDate(catchDate.getDate() - daysAgo);

    // Random hour with bias toward early morning (5-9) and evening (4-8)
    const hourBias = Math.random();
    let hour: number;
    if (hourBias < 0.4) {
      hour = 5 + Math.floor(Math.random() * 5); // 5-9 AM
    } else if (hourBias < 0.8) {
      hour = 16 + Math.floor(Math.random() * 5); // 4-8 PM
    } else {
      hour = Math.floor(Math.random() * 24); // Any time
    }
    catchDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

    // Pick location using weighted random selection
    const totalWeight = locationWeights.reduce((a, b) => a + b, 0);
    let weightRand = Math.random() * totalWeight;
    let locationIndex = 0;
    for (let j = 0; j < locationWeights.length; j++) {
      weightRand -= locationWeights[j];
      if (weightRand <= 0) {
        locationIndex = j;
        break;
      }
    }
    const location = locations[locationIndex];

    const speciesChoice = species[Math.floor(Math.random() * species.length)];

    // Weight varies by species
    let weight: number;
    switch (speciesChoice) {
      case 'Chinook Salmon':
        weight = 3 + Math.random() * 8;
        break;
      case 'Northern Pike':
        weight = 2 + Math.random() * 6;
        break;
      case 'Largemouth Bass':
      case 'Striped Bass':
      case 'Channel Catfish':
      case 'Common Carp':
        weight = 1 + Math.random() * 4;
        break;
      case 'Rainbow Trout':
      case 'Brown Trout':
      case 'Walleye':
        weight = 0.5 + Math.random() * 3;
        break;
      default:
        weight = 0.2 + Math.random() * 1.5;
    }
    weight = Math.round(weight * 10) / 10;

    const length = Math.round(20 + weight * 8 + Math.random() * 10);

    // Temperature varies by season
    const month = catchDate.getMonth();
    let temp: number;
    if (month >= 5 && month <= 8) {
      temp = 20 + Math.random() * 15;
    } else if (month >= 11 || month <= 2) {
      temp = 5 + Math.random() * 10;
    } else {
      temp = 12 + Math.random() * 12;
    }
    temp = Math.round(temp);

    const weatherCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const pressure = 1000 + Math.floor(Math.random() * 30);
    const humidity = 40 + Math.floor(Math.random() * 50);
    const windSpeed = Math.floor(Math.random() * 25);

    catches.push({
      id: `test-catch-${i + 1}`,
      createdAt: catchDate,
      updatedAt: Math.random() > 0.7 ? new Date(catchDate.getTime() + 300000) : null,
      latitude: location.lat + (Math.random() - 0.5) * 0.005, // Tighter clustering
      longitude: location.lng + (Math.random() - 0.5) * 0.005,
      species: speciesChoice,
      weight,
      weightUnit: 'kg',
      length,
      lengthUnit: 'cm',
      lure: lures[Math.floor(Math.random() * lures.length)],
      notes: notes[Math.floor(Math.random() * notes.length)] || null,
      photoUri: null,
      temperature: temp,
      temperatureUnit: 'C',
      weatherCondition,
      pressure,
      pressureUnit: 'hPa',
      humidity,
      windSpeed,
      weatherFetchedAt: new Date(catchDate.getTime() + 60000),
      isDraft: false,
      pendingWeatherFetch: false,
      syncedAt: null,
    });
  }

  // Sort by date descending (newest first)
  return catches.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Export a singleton instance for easy use
export const TEST_CATCHES = generateTestCatches();
