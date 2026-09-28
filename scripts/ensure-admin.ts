import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
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

  const byEmail = (await db.from("users").select("id").eq("email", payload.email).maybeSingle()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };
  if (byEmail.error) throw new Error(byEmail.error.message);
  const byUsername = (await db.from("users").select("id").eq("username", payload.username).maybeSingle()) as {
    data: { id: string } | null;
    error: { message: string } | null;
  };
  if (byUsername.error) throw new Error(byUsername.error.message);
  const existing = byEmail.data ?? byUsername.data;

  if (existing?.id) {
    const { error } = await db.from("users").update(payload).eq("id", existing.id);
    if (error) throw error;
    console.log("Admin itaeris di-update.");
    return;
  }

  const { error } = await db.from("users").insert(payload);
  if (error) throw error;
  console.log("Admin itaeris dibuat.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
