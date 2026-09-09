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

function daysFromToday(offset: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString();
}

function dayKey(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase env belum di-set.");

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: secret } },
  });

  await supabase.from("activities").delete().neq("id", "");
  await supabase.from("comments").delete().neq("id", "");
  await supabase.from("attachments").delete().neq("id", "");
  await supabase.from("daily_logs").delete().neq("id", "");
  await supabase.from("tasks").delete().neq("id", "");
  await supabase.from("sprints").delete().neq("id", "");
  await supabase.from("project_members").delete().neq("id", "");
  await supabase.from("projects").delete().neq("id", "");
  await supabase.from("users").delete().neq("id", "");

  const passwordHash = await bcrypt.hash("aerisbeaute", 10);
  const { data: users, error: userError } = await supabase
    .from("users")
    .insert([
      {
        name: "Aeris",
        username: "itaeris",
        email: "it@aerisbeaute.com",
        password_hash: passwordHash,
        role: "admin",
        initials: "IT",
        color: "#3c241c",
      },
      { name: "Maya Putri", email: "maya@nara.app", initials: "MP", color: "#2f5d50", role: "member" },
      { name: "Dimas Rahman", email: "dimas@nara.app", initials: "DR", color: "#3d5a80", role: "member" },
    ])
    .select("*");
  if (userError || !users) {
    throw userError ?? new Error("Gagal seed users. Jalankan supabase/schema.sql atau migration_auth.sql dulu.");
  }

  const aeris = users.find((user) => user.email === "it@aerisbeaute.com")!;
  const maya = users.find((user) => user.email === "maya@nara.app")!;
  const dimas = users.find((user) => user.email === "dimas@nara.app")!;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: "Relia Pay",
      description:
        "Dompet digital untuk transfer, tagihan, dan checkout merchant. Sprint berjalan fokus ke onboarding KYC dan payment core.",
      color: "#c45c2a",
      share_code: "RELI-7K2M",
      owner_id: aeris.id,
    })
    .select("*")
    .single();
  if (projectError || !project) throw projectError;

  const { error: memberError } = await supabase.from("project_members").insert([
    { project_id: project.id, user_id: aeris.id, role: "owner" },
    { project_id: project.id, user_id: maya.id, role: "member" },
    { project_id: project.id, user_id: dimas.id, role: "member" },
  ]);
  if (memberError) throw memberError;

  const { data: sprints, error: sprintError } = await supabase
    .from("sprints")
    .insert([
      {
        project_id: project.id,
        name: "Sprint 12 — KYC & Core Pay",
        goal: "Onboarding KYC lolos UAT dan transfer antar-user bisa dipantau dari dashboard ops.",
        start_date: daysFromToday(-5),
        end_date: daysFromToday(9),
        status: "active",
      },
      {
        project_id: project.id,
        name: "Sprint 13 — Merchant Checkout",
        goal: "QRIS dinamis dan settlement harian untuk 10 merchant pilot.",
        start_date: daysFromToday(10),
        end_date: daysFromToday(23),
        status: "planning",
      },
    ])
    .select("*");
  if (sprintError || !sprints) throw sprintError;
  const sprint1 = sprints[0];
  const sprint2 = sprints[1];

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .insert([
      {
        project_id: project.id,
        title: "Alur onboarding KYC e-KTP",
        description: "Upload foto KTP, selfie liveness, dan review manual untuk kasus gagal OCR.",
        status: "in_progress",
        priority: "urgent",
        type: "story",
        points: 8,
        rank: 1000,
        sprint_id: sprint1.id,
        assignee_id: maya.id,
        start_date: daysFromToday(-4),
        due_date: daysFromToday(3),
      },
      {
        project_id: project.id,
        title: "Webhook payment gateway",
        description: "Idempotent handler untuk settlement, refund, dan failed charge.",
        status: "review",
        priority: "high",
        type: "task",
        points: 5,
        rank: 2000,
        sprint_id: sprint1.id,
        assignee_id: dimas.id,
        start_date: daysFromToday(-6),
        due_date: daysFromToday(1),
      },
      {
        project_id: project.id,
        title: "Dashboard monitoring transaksi",
        description: "Filter status, export CSV, dan alert spike gagal bayar.",
        status: "todo",
        priority: "high",
        type: "story",
        points: 5,
        rank: 3000,
        sprint_id: sprint1.id,
        assignee_id: aeris.id,
        start_date: daysFromToday(0),
        due_date: daysFromToday(6),
      },
      {
        project_id: project.id,
        title: "Push notifikasi transfer",
        description: "FCM + fallback email untuk kredit masuk dan permintaan uang.",
        status: "todo",
        priority: "medium",
        type: "story",
        points: 3,
        rank: 4000,
        sprint_id: sprint1.id,
        assignee_id: maya.id,
        start_date: daysFromToday(2),
        due_date: daysFromToday(8),
      },
      {
        project_id: project.id,
        title: "Perbaiki timeout OTP",
        description: "OTP kadaluarsa 60 detik di device lambat. Samakan clock server.",
        status: "done",
        priority: "high",
        type: "bug",
        points: 2,
        rank: 5000,
        sprint_id: sprint1.id,
        assignee_id: dimas.id,
        start_date: daysFromToday(-8),
        due_date: daysFromToday(-2),
      },
      {
        project_id: project.id,
        title: "Spike: biaya settlement QRIS",
        description: "Bandingkan MDR tiga provider untuk volume 50 ribu trx/hari.",
        status: "backlog",
        priority: "medium",
        type: "spike",
        points: 3,
        rank: 6000,
        sprint_id: sprint2.id,
        assignee_id: aeris.id,
        start_date: daysFromToday(10),
        due_date: daysFromToday(14),
      },
      {
        project_id: project.id,
        title: "Checkout merchant QR dinamis",
        description: "Generate QR per invoice, expire 15 menit, tampilkan status di kasir.",
        status: "backlog",
        priority: "high",
        type: "story",
        points: 8,
        rank: 7000,
        sprint_id: sprint2.id,
        start_date: daysFromToday(12),
        due_date: daysFromToday(20),
      },
      {
        project_id: project.id,
        title: "Dark mode app pelanggan",
        description: "Token warna baru, cek kontras di kartu saldo dan riwayat.",
        status: "backlog",
        priority: "low",
        type: "task",
        points: 3,
        rank: 8000,
        start_date: daysFromToday(16),
        due_date: daysFromToday(24),
      },
      {
        project_id: project.id,
        title: "Audit log akses admin",
        description: "Catat unduhan laporan dan perubahan limit user.",
        status: "backlog",
        priority: "medium",
        type: "story",
        points: 5,
        rank: 9000,
        assignee_id: dimas.id,
        due_date: daysFromToday(18),
      },
    ])
    .select("id");
  if (taskError || !tasks) throw taskError;

  const { error: commentError } = await supabase.from("comments").insert([
    {
      task_id: tasks[0].id,
      user_id: aeris.id,
      body: "Prioritaskan kasus OCR gagal — support kebanjiran tiket minggu ini.",
    },
    {
      task_id: tasks[0].id,
      user_id: maya.id,
      body: "Liveness sudah di staging. Tinggal wiring ke antrian review manual.",
    },
    {
      task_id: tasks[1].id,
      user_id: dimas.id,
      body: "Retry queue pakai unique eventId. Mohon cek edge case double webhook.",
    },
  ]);
  if (commentError) throw commentError;

  const { error: dailyError } = await supabase.from("daily_logs").insert([
    {
      project_id: project.id,
      user_id: aeris.id,
      date: dayKey(0),
      yesterday: "Review desain dashboard monitoring dan rapat scope Sprint 13.",
      today: "Breakdown story merchant QR dan cek blocker KYC bareng Maya.",
      blockers: "Menunggu akses sandbox provider QRIS.",
    },
    {
      project_id: project.id,
      user_id: maya.id,
      date: dayKey(0),
      yesterday: "Selesai flow upload KTP di staging.",
      today: "Integrasi liveness + state machine review.",
      blockers: "Dataset wajah untuk test liveness masih sedikit.",
    },
    {
      project_id: project.id,
      user_id: dimas.id,
      date: dayKey(-1),
      yesterday: "Tutup bug OTP timeout.",
      today: "PR webhook siap review.",
      blockers: "",
    },
  ]);
  if (dailyError) throw dailyError;

  const { error: activityError } = await supabase.from("activities").insert([
    { project_id: project.id, user_id: aeris.id, message: "mengaktifkan Sprint 12 — KYC & Core Pay" },
    { project_id: project.id, user_id: maya.id, message: 'memindahkan "Alur onboarding KYC e-KTP" ke In Progress' },
    { project_id: project.id, user_id: dimas.id, message: 'menyelesaikan "Perbaiki timeout OTP"' },
  ]);
  if (activityError) throw activityError;

  console.log("Seeded Relia Pay to Supabase.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
