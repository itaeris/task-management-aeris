import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase env is not set.");

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: secret } },
  });

  const passwordHash = await bcrypt.hash("aerisbeaute", 10);
  const payload = {
    name: "Aeris",
    username: "itaeris",
    email: "it@aerisbeaute.com",
    password_hash: passwordHash,
    role: "admin",
    initials: "IT",
    color: "#3c241c",
  };

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .or("email.eq.it@aerisbeaute.com,username.eq.itaeris")
    .maybeSingle();
  if (lookupError) {
    if (lookupError.code === "42703" || /username|password_hash/i.test(lookupError.message)) {
      throw new Error(
        "Login columns are missing. Run supabase/migration_auth.sql in the Supabase SQL Editor, then rerun npm run db:admin.",
      );
    }
    throw lookupError;
  }

  if (existing?.id) {
    const { error } = await supabase.from("users").update(payload).eq("id", existing.id);
    if (error) throw error;
    console.log("Admin itaeris di-update.");
    return;
  }

  const { error } = await supabase.from("users").insert(payload);
  if (error) throw error;
  console.log("Admin itaeris dibuat.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
