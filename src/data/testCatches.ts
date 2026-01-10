import { type Catch } from "../db";

export function generateTestCatches(): Catch[] {
  const speciesList = [
    "Largemouth Bass",
    "Rainbow Trout",
    "Chinook Salmon",
    "Channel Catfish",
    "Yellow Perch",
    "Northern Pike",
    "Walleye",
    "Bluegill",
    "Striped Bass",
  ];

  const locations = [
    { lat: 37.7285, lon: -122.4936 }, // Lake Merced
    { lat: 37.5485, lon: -122.0511 }, // Quarry Lakes
    { lat: 37.4419, lon: -122.143 }, // Stevens Creek
  ];

  const catches: Catch[] = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const location = locations[Math.floor(Math.random() * locations.length)];
    const species = speciesList[Math.floor(Math.random() * speciesList.length)];
    const weight = Number((Math.random() * 10).toFixed(1));

    catches.push({
      id: `test-catch-${i}`,
      timestamp: date,
      latitude: location.lat + (Math.random() - 0.5) * 0.01,
      longitude: location.lon + (Math.random() - 0.5) * 0.01,
      species,
      weight,
      length: Number((weight * 2 + 10).toFixed(1)), // Rough correlation
      notes: `Test catch ${i}`,
      weatherData: {
        temp: 65 + Math.random() * 10,
        description: Math.random() > 0.5 ? "Sunny" : "Cloudy",
      },
      pendingWeatherFetch: false,
      createdAt: date,
      updatedAt: date,
    });
  }

  return catches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
