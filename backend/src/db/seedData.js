export const cities = [
  ["Lisbon", "Portugal", "Europe", 5.8, 9.1, "https://images.unsplash.com/photo-1500375592092-40eb2168fd21", "Hills, tiled facades, Atlantic light, and relaxed food culture.", true],
  ["Seville", "Spain", "Europe", 5.6, 8.7, "https://images.unsplash.com/photo-1558642084-fd07fae5282e", "Moorish palaces, flamenco nights, and orange-tree courtyards.", true],
  ["Tokyo", "Japan", "Asia", 8.4, 9.8, "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf", "Neon neighborhoods, temples, design stores, and exacting food.", true],
  ["Kyoto", "Japan", "Asia", 7.2, 9.5, "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e", "Shrines, gardens, traditional lanes, and seasonal rituals.", true],
  ["Marrakesh", "Morocco", "Africa", 4.9, 8.2, "https://images.unsplash.com/photo-1548018560-c7196548e84d", "Souks, riads, desert gateways, and fragrant kitchens.", true],
  ["Cape Town", "South Africa", "Africa", 5.9, 8.8, "https://images.unsplash.com/photo-1580060839134-75a5edca2e99", "Mountain views, coast roads, wine country, and layered history.", true],
  ["Lima", "Peru", "Americas", 5.3, 8.4, "https://images.unsplash.com/photo-1531968455001-5c5272a41129", "Pacific cliffs, ceviche counters, museums, and ancient sites nearby.", false],
  ["Cusco", "Peru", "Americas", 4.8, 9.0, "https://images.unsplash.com/photo-1526392060635-9d6019884377", "Andean history and high-altitude routes toward Machu Picchu.", true],
  ["Reykjavik", "Iceland", "Europe", 9.2, 8.6, "https://images.unsplash.com/photo-1504829857797-ddff29c27927", "Nordic city base for waterfalls, hot springs, and volcanic roads.", false],
  ["Queenstown", "New Zealand", "Oceania", 8.1, 8.9, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", "Lakes, mountains, hikes, and adventure sports.", true],
  ["Bali", "Indonesia", "Asia", 4.4, 9.2, "https://images.unsplash.com/photo-1537996194471-e657df975ab4", "Rice terraces, surf, temples, and wellness retreats.", false],
  ["Hanoi", "Vietnam", "Asia", 3.6, 8.5, "https://images.unsplash.com/photo-1528127269322-539801943592", "Old Quarter energy, lakeside mornings, and rich street food.", false],
  ["Paris", "France", "Europe", 8.7, 9.7, "https://images.unsplash.com/photo-1502602898657-3e91760cbb34", "Museums, cafes, gardens, and endlessly walkable neighborhoods.", true],
  ["Amsterdam", "Netherlands", "Europe", 8.0, 8.9, "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4", "Canals, galleries, cycling routes, and compact day plans.", false],
  ["Vancouver", "Canada", "Americas", 8.3, 8.6, "https://images.unsplash.com/photo-1504805572947-34fad45aed93", "Harbor paths, forests, snow peaks, and easy city nature.", false],
  ["Mexico City", "Mexico", "Americas", 5.0, 9.0, "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a", "Markets, museums, parks, design, and historic neighborhoods.", true],
  ["Istanbul", "Turkey", "Europe", 5.2, 9.1, "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200", "Ferries, mosques, bazaars, and food shaped by continents.", false],
  ["Dubai", "United Arab Emirates", "Asia", 8.9, 8.4, "https://images.unsplash.com/photo-1512453979798-5ea266f8880c", "Architecture, desert experiences, beaches, and global dining.", false],
  ["Sydney", "Australia", "Oceania", 8.8, 8.8, "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9", "Harbor landmarks, surf beaches, ferries, and coastal walks.", false],
  ["Nairobi", "Kenya", "Africa", 4.7, 8.1, "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6", "Urban energy, national park access, and safari gateways.", false],
];

const activityTemplates = [
  ["Sunrise Walking Tour", "A relaxed guided walk through local landmarks and food stops.", "sightseeing", 28, 3],
  ["Neighborhood Food Crawl", "Taste signature dishes across markets and family-run counters.", "food", 46, 3.5],
  ["Museum and Culture Pass", "A half-day route across galleries, architecture, and local history.", "culture", 34, 4],
  ["Nature Escape", "A guided outdoor route close to the city with easy logistics.", "nature", 52, 5],
  ["Market Finds Session", "Browse craft stalls, design stores, and memorable souvenirs.", "shopping", 25, 2],
  ["Adventure Sampler", "A high-energy activity with local guides and safety gear included.", "adventure", 78, 4],
];

export const activities = cities.flatMap(([city, country], cityIndex) =>
  activityTemplates.slice(0, cityIndex % 2 === 0 ? 2 : 1).map((activity, activityIndex) => ({
    name: `${city} ${activity[0]}`,
    description: activity[1],
    city,
    country,
    category: activity[2],
    estimated_cost: activity[3] + (cityIndex % 5) * 6,
    duration_hours: activity[4],
    image_url: null,
    is_featured: cityIndex < 10 && activityIndex === 0,
  })),
).slice(0, 30);

export async function seedReferenceData(query) {
  for (const city of cities) {
    await query(
      `INSERT INTO cities (
        name, country, region, cost_index, popularity_score, image_url, description, is_featured
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (name, country) DO UPDATE SET
         region = EXCLUDED.region,
         cost_index = EXCLUDED.cost_index,
         popularity_score = EXCLUDED.popularity_score,
         image_url = EXCLUDED.image_url,
         description = EXCLUDED.description,
         is_featured = EXCLUDED.is_featured`,
      city,
    );
  }

  for (const activity of activities) {
    await query(
  `INSERT INTO activities (
    name, description, city, country, category, estimated_cost, duration_hours, image_url, is_featured
  )
   SELECT 
    $1::text,
    $2::text,
    $3::text,
    $4::text,
    $5::activity_category,
    $6::numeric,
    $7::numeric,
    $8::text,
    $9::boolean
   WHERE NOT EXISTS (
     SELECT 1 
     FROM activities 
     WHERE name = $1::text 
       AND city = $3::text
   )`,
  [
    activity.name,
    activity.description,
    activity.city,
    activity.country,
    activity.category,
    activity.estimated_cost,
    activity.duration_hours,
    activity.image_url,
    activity.is_featured,
  ],
);
    
  }
}
