import { migratePostgres } from "@deck/engine";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL unset — skip migrate");
  process.exit(0);
}

await migratePostgres(url);
console.log("migrations applied");
