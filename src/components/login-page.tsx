"use client";

import { useActionState, useState } from "react";
import {
  CalendarDays,
  Eye,
  EyeOff,
  Flag,
  LayoutDashboard,
  Lock,
  Mail,
  NotebookPen,
  Sunrise,
} from "lucide-react";
import { login, type LoginState } from "@/lib/actions/identity";
import { BrandLockup } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, useReducedMotion } from "framer-motion";
import { easeOutSoft, fadeUp, stagger } from "@/components/motion";

const FEATURES = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Product log", icon: NotebookPen },
  { label: "Scrum", icon: Flag },
  { label: "Daily", icon: Sunrise },
  { label: "Calendar", icon: CalendarDays },
];

function greetingLabel() {
  const hour = new Date().getHours();
  if (hour < 11) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

const GOOGLE_ERRORS: Record<string, string> = {
  google_config: "Google login is not configured.",
  google_denied: "Google login was cancelled.",
  google_state: "Google session expired. Try again.",
  google_token: "Could not verify with Google.",
  google_profile: "Could not load your Google profile.",
  google_email: "This Google account has no email.",
  google_user: "Could not create or sign in to the account.",
};

export function LoginPage({ nextPath = "/", error }: { nextPath?: string; error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(GOOGLE_ERRORS[error ?? ""] ?? "");
  const [state, action, pending] = useActionState(login, {} as LoginState);
  const greeting = greetingLabel();
  const reduce = useReducedMotion();

  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-paper via-sand to-paper-2 text-ink lg:grid lg:grid-cols-2">
      <section className="login-hero relative flex min-h-[38vh] flex-col px-6 pb-10 pt-6 sm:px-10 lg:min-h-dvh lg:px-12 lg:py-10">
        <motion.div
          className="flex items-center gap-3"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutSoft }}
        >
          <BrandLockup markClassName="h-9 w-9" textClassName="text-[13px] tracking-[0.18em] text-ink" />
        </motion.div>

        <motion.div
          className="mt-10 max-w-xl lg:mt-auto lg:mb-auto"
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={stagger}
        >
          <motion.p variants={fadeUp} className="text-[11px] font-semibold tracking-[0.28em] text-terracotta">
            {greeting}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-serif mt-3 text-4xl leading-[1.12] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
          >
            Your product workspace.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-md text-sm leading-relaxed text-muted lg:text-[15px]">
            Product log, scrum, daily check, and kanban for the team - in one place.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 hidden flex-wrap gap-2 lg:flex">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/60 px-3.5 py-2 text-[12px] text-ink"
                >
                  <Icon size={14} />
                  {item.label}
                </span>
              );
            })}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex gap-3 lg:hidden">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  title={item.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper/50 text-ink"
                >
                  <Icon size={16} />
                </span>
              );
            })}
          </motion.div>
        </motion.div>

        <p className="mt-8 hidden text-xs text-muted lg:block">Task Management</p>
      </section>

      <section className="relative -mt-6 flex-1 rounded-t-[2.4rem] bg-paper px-6 pt-4 pb-8 sm:px-8 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:bg-transparent lg:px-10 lg:py-12">
        <div className="absolute top-4 right-4 z-10 lg:top-6 lg:right-6">
          <ThemeToggle />
        </div>
        <motion.div
          className="relative lg:w-full lg:max-w-[440px] lg:rounded-[32px] lg:bg-paper/90 lg:px-9 lg:py-10 lg:shadow-[0_24px_60px_rgba(37,99,235,0.12)] lg:backdrop-blur"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: easeOutSoft }}
        >
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-paper-2 lg:hidden" />

          <h2 className="font-serif text-[2rem] leading-none text-ink">Welcome back</h2>
          <p className="mt-2 text-sm text-muted">Sign in to continue to Task Management</p>

          <form action={action} className="mt-7 grid gap-4">
            <input type="hidden" name="next" value={nextPath} />

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-sky-400" />
                <input
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="it@aerisbeaute.com"
                  className="h-12 w-full rounded-xl border border-line bg-input pr-3 pl-10 text-sm text-ink outline-none transition placeholder:text-muted focus:border-terracotta/40 focus:ring-2 focus:ring-terracotta/15"
                />
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-sky-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border border-line bg-input pr-11 pl-10 text-sm text-ink outline-none transition focus:border-terracotta/40 focus:ring-2 focus:ring-terracotta/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-sky-400 hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {state.error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{state.error}</p>
            ) : null}
            {notice ? <p className="text-sm text-muted">{notice}</p> : null}

            <button
              disabled={pending}
              className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-terracotta text-sm font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-60"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-[10px] font-semibold tracking-[0.18em] text-muted">
            <span className="h-px flex-1 bg-line" />
            OR CONTINUE WITH
            <span className="h-px flex-1 bg-line" />
          </div>

          <a
            href={`/api/auth/google?next=${encodeURIComponent(nextPath)}`}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-line bg-paper text-sm font-medium text-ink transition hover:bg-sand"
          >
            <GoogleMark />
            Sign in with Google
          </a>

          <button
            type="button"
            onClick={() => setNotice("Contact the IT admin to reset your password.")}
            className="mt-5 block w-full text-center text-sm font-medium text-terracotta hover:underline"
          >
            Forgot password?
          </button>
        </motion.div>
      </section>
    </main>
  );
}
