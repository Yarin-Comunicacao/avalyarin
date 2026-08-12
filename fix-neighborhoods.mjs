/**
 * Fix neighborhoods for all active establishments using Google Maps Reverse Geocoding.
 * Extracts the exact neighborhood (sublocality_level_1 or sublocality) from Google's response.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || "";

async function reverseGeocode(lat, lng) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/geocode/json`);
  url.searchParams.append("key", FORGE_API_KEY);
  url.searchParams.append("latlng", `${lat},${lng}`);
  url.searchParams.append("language", "pt-BR");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== "OK" || !data.results || data.results.length === 0) {
    return null;
  }

  // Extract neighborhood from address_components
  // Priority: sublocality_level_1 > sublocality > neighborhood
  for (const result of data.results) {
    for (const component of result.address_components) {
      if (component.types.includes("sublocality_level_1")) {
        return component.long_name;
      }
    }
  }
  for (const result of data.results) {
    for (const component of result.address_components) {
      if (component.types.includes("sublocality")) {
        return component.long_name;
      }
    }
  }
  for (const result of data.results) {
    for (const component of result.address_components) {
      if (component.types.includes("neighborhood")) {
        return component.long_name;
      }
    }
  }

  return null;
}

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  // Get all active establishments with coordinates
  const [rows] = await connection.execute(
    "SELECT id, name, neighborhood, lat, lng FROM establishments WHERE status = 'active' AND lat IS NOT NULL AND lng IS NOT NULL AND lat != 0 AND lng != 0"
  );

  console.log(`Found ${rows.length} active establishments with coordinates.`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;
  let noResult = 0;
  const changes = [];

  for (let i = 0; i < rows.length; i++) {
    const est = rows[i];
    try {
      const newNeighborhood = await reverseGeocode(est.lat, est.lng);

      if (!newNeighborhood) {
        noResult++;
        console.log(`[${i + 1}/${rows.length}] ${est.name} — no neighborhood found`);
        continue;
      }

      if (newNeighborhood !== est.neighborhood) {
        await connection.execute(
          "UPDATE establishments SET neighborhood = ? WHERE id = ?",
          [newNeighborhood, est.id]
        );
        changes.push({ id: est.id, name: est.name, old: est.neighborhood, new: newNeighborhood });
        updated++;
        console.log(`[${i + 1}/${rows.length}] ${est.name}: "${est.neighborhood}" → "${newNeighborhood}"`);
      } else {
        unchanged++;
        if ((i + 1) % 20 === 0) {
          console.log(`[${i + 1}/${rows.length}] Progress... (${updated} updated, ${unchanged} unchanged)`);
        }
      }

      // Rate limiting: 50ms between requests
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (err) {
      failed++;
      console.error(`[${i + 1}/${rows.length}] ${est.name} — ERROR: ${err.message}`);
      // Continue with next establishment
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${rows.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`No result: ${noResult}`);
  console.log(`Failed: ${failed}`);

  if (changes.length > 0) {
    console.log("\n=== CHANGES ===");
    for (const c of changes) {
      console.log(`  ${c.name}: "${c.old}" → "${c.new}"`);
    }
  }

  // Verify final distribution
  const [finalDist] = await connection.execute(
    "SELECT neighborhood, COUNT(*) as total FROM establishments WHERE status = 'active' GROUP BY neighborhood ORDER BY total DESC"
  );
  console.log("\n=== FINAL DISTRIBUTION ===");
  for (const row of finalDist) {
    console.log(`  ${row.neighborhood}: ${row.total}`);
  }

  await connection.end();
}

main().catch(console.error);
