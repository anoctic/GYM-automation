import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
}

import { kioskToggleCheckInOut } from "../src/actions/kiosk";

async function run() {
  console.log("Testing Kiosk Check-In & Check-Out...");
  
  // Test check-in for AF-1003 (Amit Verma)
  const res1 = await kioskToggleCheckInOut("anytime-fitness-sikandrab", "1003");
  console.log("Result 1 (Check-in or Check-out):", res1.action, res1.member?.full_name, res1.durationText || "");

  // Toggle again to check out or back
  const res2 = await kioskToggleCheckInOut("anytime-fitness-sikandrab", "AF-1003");
  console.log("Result 2 (Toggle):", res2.action, res2.member?.full_name, res2.durationText || "");

  console.log("Kiosk test completed successfully!");
}

run().catch((err) => {
  console.error("Kiosk test failed:", err);
  process.exit(1);
});
