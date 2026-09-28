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
  await db.from("file_blobs").delete().neq("stored_name", "");
  await db.from("google_calendar_events").delete().neq("id", "");
  await db.from("google_calendar_connections").delete().neq("user_id", "");
  await db.from("presences").delete().neq("user_id", "");
  await db.from("project_analyses").delete().neq("project_id", "");
  await db.from("activities").delete().neq("id", "");
  await db.from("comments").delete().neq("id", "");
  await db.from("attachments").delete().neq("id", "");
  await db.from("daily_logs").delete().neq("id", "");
  await db.from("task_assignees").delete().neq("id", "");
  await db.from("tasks").delete().neq("id", "");
  await db.from("sprints").delete().neq("id", "");
  await db.from("project_pins").delete().neq("id", "");
  await db.from("project_members").delete().neq("id", "");
  await db.from("projects").delete().neq("id", "");
  await db.from("group_members").delete().neq("id", "");
  await db.from("groups").delete().neq("id", "");
  await db.from("users").delete().neq("id", "");

  const passwordHash = await bcrypt.hash("aerisbeaute", 10);
  const { data: users, error: userError } = await db
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
    throw userError ?? new Error("Failed to seed users. Apply mysql/schema.sql first.");
  }

  const aeris = users.find((user) => user.email === "it@aerisbeaute.com")!;
  const maya = users.find((user) => user.email === "maya@nara.app")!;
  const dimas = users.find((user) => user.email === "dimas@nara.app")!;

  const { data: project, error: projectError } = await db
    .from("projects")
    .insert({
      name: "Relia Pay",
      description:
        "Digital wallet for transfers, bills, and merchant checkout. The current sprint focuses on KYC onboarding and the payment core.",
      color: "#c45c2a",
      share_code: "RELI-7K2M",
      owner_id: aeris.id,
    })
    .select("*")
    .single();
  if (projectError || !project) throw projectError;

  const { error: memberError } = await db.from("project_members").insert([
    { project_id: project.id, user_id: aeris.id, role: "owner" },
    { project_id: project.id, user_id: maya.id, role: "member" },
    { project_id: project.id, user_id: dimas.id, role: "member" },
  ]);
  if (memberError) throw memberError;

  const { data: sprints, error: sprintError } = await db
    .from("sprints")
    .insert([
      {
        project_id: project.id,
        name: "Sprint 12 — KYC & Core Pay",
        goal: "KYC onboarding passes UAT, and peer-to-peer transfers can be monitored from the ops dashboard.",
        start_date: daysFromToday(-5),
        end_date: daysFromToday(9),
        status: "active",
      },
      {
        project_id: project.id,
        name: "Sprint 13 — Merchant Checkout",
        goal: "Dynamic QRIS and daily settlement for 10 pilot merchants.",
        start_date: daysFromToday(10),
        end_date: daysFromToday(23),
        status: "planning",
      },
    ])
    .select("*");
  if (sprintError || !sprints) throw sprintError;
  const sprint1 = sprints[0];
  const sprint2 = sprints[1];

  const { data: tasks, error: taskError } = await db
    .from("tasks")
    .insert([
      {
        project_id: project.id,
        title: "e-KTP KYC onboarding flow",
        description: "Upload ID photo, liveness selfie, and manual review for failed OCR cases.",
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
        description: "Idempotent handler for settlement, refunds, and failed charges.",
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
        title: "Transaction monitoring dashboard",
        description: "Status filters, CSV export, and alerts for payment-failure spikes.",
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
        title: "Transfer push notifications",
        description: "FCM plus email fallback for incoming credit and money requests.",
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
        title: "Fix OTP timeout",
        description: "OTP expires in 60 seconds on slow devices. Align the server clock.",
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
        title: "Spike: QRIS settlement fees",
        description: "Compare MDR across three providers at 50k transactions/day.",
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
        title: "Dynamic merchant QR checkout",
        description: "Generate a QR per invoice, expire after 15 minutes, show status at the cashier.",
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
        title: "Customer app dark mode",
        description: "New color tokens; check contrast on the balance card and history.",
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
        title: "Admin access audit log",
        description: "Record report downloads and user-limit changes.",
        status: "backlog",
        priority: "medium",
        type: "story",
        points: 5,
        rank: 9000,
        assignee_id: dimas.id,
        due_date: daysFromToday(18),
      },
    ])
    .select("id, assignee_id");
  if (taskError || !tasks) throw taskError;

  const assigneeRows = [
    ...tasks
      .filter((task): task is typeof task & { assignee_id: string } => Boolean(task.assignee_id))
      .map((task) => ({ task_id: task.id, user_id: task.assignee_id })),
    { task_id: tasks[0].id, user_id: aeris.id },
  ];
  const { error: assigneeError } = await db.from("task_assignees").insert(assigneeRows);
  if (assigneeError && !/task_assignees/i.test(assigneeError.message)) throw assigneeError;

  const { error: commentError } = await db.from("comments").insert([
    {
      task_id: tasks[0].id,
      user_id: aeris.id,
      body: "Prioritize failed OCR cases — support is flooded with tickets this week.",
    },
    {
      task_id: tasks[0].id,
      user_id: maya.id,
      body: "Liveness is already on staging. Still need wiring to the manual review queue.",
    },
    {
      task_id: tasks[1].id,
      user_id: dimas.id,
      body: "Retry queue uses unique eventId. Please check the double-webhook edge case.",
    },
  ]);
  if (commentError) throw commentError;

  const { error: dailyError } = await db.from("daily_logs").insert([
    {
      project_id: project.id,
      user_id: aeris.id,
      date: dayKey(0),
      yesterday: "Reviewed the monitoring dashboard design and Sprint 13 scope meeting.",
      today: "Break down the merchant QR story and check KYC blockers with Maya.",
      blockers: "Waiting on QRIS provider sandbox access.",
    },
    {
      project_id: project.id,
      user_id: maya.id,
      date: dayKey(0),
      yesterday: "Finished the ID-upload flow on staging.",
      today: "Liveness integration + review state machine.",
      blockers: "Not enough face samples for liveness tests.",
    },
    {
      project_id: project.id,
      user_id: dimas.id,
      date: dayKey(-1),
      yesterday: "Closed the OTP timeout bug.",
      today: "Webhook PR ready for review.",
      blockers: "",
    },
  ]);
  if (dailyError) throw dailyError;

  const { error: activityError } = await db.from("activities").insert([
    { project_id: project.id, user_id: aeris.id, message: "activated Sprint 12 — KYC & Core Pay" },
    { project_id: project.id, user_id: maya.id, message: 'moved "e-KTP KYC onboarding flow" to In Progress' },
    { project_id: project.id, user_id: dimas.id, message: 'completed "Fix OTP timeout"' },
  ]);
  if (activityError) throw activityError;

  console.log("Seeded Relia Pay.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
