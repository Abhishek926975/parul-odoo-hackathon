import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { closePool, query } from "./connection.js";
import { schemaSql } from "./schema.js";
import { seedReferenceData } from "./seedData.js";

dotenv.config();

const demoUsers = [
  ["Asha", "Mehta", "user1@traveloop.com", "user", "Mumbai", "India"],
  ["Leo", "Warren", "user2@traveloop.com", "user", "Austin", "United States"],
  ["Nora", "Admin", "admin@traveloop.com", "admin", "London", "United Kingdom"],
];

const trips = [
  {
    email: "user1@traveloop.com",
    name: "Portugal and Andalusia Loop",
    description: "Tiles, trains, orange courtyards, and slow dinners.",
    start: "2026-06-11",
    end: "2026-06-18",
    status: "upcoming",
    budget: 2400,
    publicSlug: "portugal-andalusia-loop",
    stops: [
      ["Lisbon", "Portugal", "2026-06-11", "2026-06-14"],
      ["Seville", "Spain", "2026-06-14", "2026-06-18"],
    ],
  },
  {
    email: "user1@traveloop.com",
    name: "Japan Spring Notes",
    description: "Temples, trains, tiny coffee bars, and sakura mornings.",
    start: "2026-04-03",
    end: "2026-04-12",
    status: "planning",
    budget: 4200,
    publicSlug: "japan-spring-notes",
    stops: [
      ["Tokyo", "Japan", "2026-04-03", "2026-04-07"],
      ["Kyoto", "Japan", "2026-04-07", "2026-04-12"],
    ],
  },
  {
    email: "user2@traveloop.com",
    name: "Cape and Coast Reset",
    description: "Cape Town base days, coast roads, and a wine country pause.",
    start: "2026-08-02",
    end: "2026-08-09",
    status: "planning",
    budget: 3100,
    publicSlug: "cape-and-coast-reset",
    stops: [
      ["Cape Town", "South Africa", "2026-08-02", "2026-08-06"],
      ["Stellenbosch", "South Africa", "2026-08-06", "2026-08-09"],
    ],
  },
  {
    email: "user2@traveloop.com",
    name: "Peru High Route",
    description: "Lima meals, Cusco acclimation, and Andean day hikes.",
    start: "2026-09-15",
    end: "2026-09-24",
    status: "upcoming",
    budget: 2800,
    publicSlug: "peru-high-route",
    stops: [
      ["Lima", "Peru", "2026-09-15", "2026-09-18"],
      ["Cusco", "Peru", "2026-09-18", "2026-09-24"],
    ],
  },
];

const packingDefaults = [
  ["Passport", "documents"],
  ["Travel insurance", "documents"],
  ["Walking shoes", "clothing"],
  ["Layer jacket", "clothing"],
  ["Charger kit", "electronics"],
  ["Toiletry pouch", "toiletries"],
  ["Reusable bottle", "other"],
];

try {
  await query(schemaSql);
  await query(
    `TRUNCATE community_posts, trip_notes, expenses, packing_items, trip_activities,
              itinerary_sections, trip_stops, trips, users, activities, cities
     RESTART IDENTITY CASCADE`,
  );
  await seedReferenceData(query);

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const userIds = new Map();

  for (const user of demoUsers) {
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, city, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email`,
      [user[0], user[1], user[2], passwordHash, user[3], user[4], user[5]],
    );
    userIds.set(result.rows[0].email, result.rows[0].id);
  }

  const allActivities = await query("SELECT * FROM activities ORDER BY created_at ASC LIMIT 12");
  const publicTripIds = [];

  for (const [tripIndex, trip] of trips.entries()) {
    const tripResult = await query(
      `INSERT INTO trips (
        user_id, name, description, start_date, end_date, status, total_budget, is_public, public_slug
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING id`,
      [
        userIds.get(trip.email),
        trip.name,
        trip.description,
        trip.start,
        trip.end,
        trip.status,
        trip.budget,
        trip.publicSlug,
      ],
    );
    const tripId = tripResult.rows[0].id;
    publicTripIds.push(tripId);

    const stopIds = [];
    for (const [index, stop] of trip.stops.entries()) {
      const stopResult = await query(
        `INSERT INTO trip_stops (trip_id, city_name, country, arrival_date, departure_date, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [tripId, stop[0], stop[1], stop[2], stop[3], index],
      );
      stopIds.push(stopResult.rows[0].id);

      const sectionTypes = ["hotel", "food", "activity"];
      for (const [sectionIndex, sectionType] of sectionTypes.entries()) {
        await query(
          `INSERT INTO itinerary_sections (
            trip_id, stop_id, title, description, section_type, date_from, date_to, budget_estimate
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tripId,
            stopResult.rows[0].id,
            `${stop[0]} ${sectionType === "hotel" ? "stay" : sectionType === "food" ? "food walk" : "city highlight"}`,
            `Planned ${sectionType} block in ${stop[0]}.`,
            sectionType,
            stop[2],
            stop[2],
            [180, 55, 85][sectionIndex],
          ],
        );
      }
    }

    for (let index = 0; index < 3; index += 1) {
      const activity = allActivities.rows[(tripIndex * 3 + index) % allActivities.rows.length];
      await query(
        `INSERT INTO trip_activities (trip_id, stop_id, activity_id, scheduled_date, actual_cost, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tripId, stopIds[index % stopIds.length], activity.id, trip.stops[index % trip.stops.length][2], activity.estimated_cost, "Saved for the itinerary."],
      );
    }

    for (const [name, category] of packingDefaults) {
      await query(
        `INSERT INTO packing_items (trip_id, user_id, name, category, is_packed)
         VALUES ($1, $2, $3, $4, $5)`,
        [tripId, userIds.get(trip.email), name, category, name === "Passport"],
      );
    }

    const expenses = [
      ["hotel", "Hotel deposit", 320, 1, trip.start],
      ["transport", "Train or local transit", 65, 2, trip.start],
      ["food", "Dinner reservations", 48, 3, trip.end],
      ["activity", "Tickets and tours", 72, 2, trip.end],
    ];
    for (const expense of expenses) {
      await query(
        `INSERT INTO expenses (trip_id, category, description, amount, qty, expense_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tripId, expense[0], expense[1], expense[2], expense[3], expense[4]],
      );
    }

    for (let index = 0; index < 2; index += 1) {
      await query(
        `INSERT INTO trip_notes (trip_id, stop_id, user_id, title, content, note_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tripId,
          stopIds[index % stopIds.length],
          userIds.get(trip.email),
          index === 0 ? "Must book" : "Food ideas",
          index === 0 ? "Confirm check-in windows and transfer timing." : "Keep one dinner open for a neighborhood find.",
          trip.stops[index % trip.stops.length][2],
        ],
      );
    }
  }

  const postBodies = [
    "A practical public plan for a warm city-to-city route with plenty of downtime.",
    "A compact guide for temples, trains, and food stops that still leaves room to wander.",
    "A coastal itinerary with budget notes, packing ideas, and flexible daily structure.",
  ];

  for (const [index, tripId] of publicTripIds.slice(0, 3).entries()) {
    await query(
      `INSERT INTO community_posts (trip_id, user_id, title, body, tags, likes_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tripId,
        userIds.get(index === 2 ? "user2@traveloop.com" : "user1@traveloop.com"),
        ["Tile Roads and Rail Days", "Spring Japan with Breathing Room", "Cape Coast Reset"][index],
        postBodies[index],
        [["europe", "rail"], ["japan", "culture"], ["coast", "budget"]][index],
        12 + index * 7,
      ],
    );
  }

  console.log("Traveloop demo database is ready.");
  console.log("Demo logins: user1@traveloop.com / demo1234, user2@traveloop.com / demo1234, admin@traveloop.com / demo1234");
} catch (error) {
  console.error("Demo seed failed:", error);
  process.exitCode = 1;
} finally {
  await closePool();
}
