import nodemailer from "nodemailer";
import { guestTotalCents } from "./price.js";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.EMAIL_SMTP_HOST) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT ?? "587"),
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    auth:
      process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS
        ? { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASS }
        : undefined,
  });
  return transporter;
}

export async function sendMail(message: MailMessage): Promise<{ sent: boolean }> {
  const tp = getTransporter();
  if (!tp) return { sent: false };
  try {
    await tp.sendMail({
      from: process.env.EMAIL_FROM ?? `kicknap <hello@${process.env.EMAIL_SMTP_HOST ?? "kicknap.com"}>`,
      ...message,
    });
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatEuro(cents: number): string {
  const value = cents / 100;
  return `\u20ac${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function formatLocalTime(iso: string): string {
  const dt = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(dt);
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;background:#f5f4f0;font-family:Arial,Helvetica,sans-serif;color:#1c2b3a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#1c2b3a;padding:28px 40px;">
            <span style="font-size:22px;font-weight:700;color:#f2c94c;">kicknap</span>
          </td></tr>
          <tr><td style="padding:32px 40px;">
            <h1 style="font-size:20px;margin:0 0 16px;color:#1c2b3a;">${title}</h1>
            <div style="color:#46586a;">${body}</div>
          </td></tr>
          <tr><td style="padding:24px 40px;border-top:1px solid #eee8dd;color:#8a97a5;font-size:12px;">
            kicknap &middot; hourly stays during your workday
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#7c8a99;font-size:13px;white-space:nowrap;">${label}</td>
    <td style="padding:6px 0;color:#1c2b3a;font-weight:600;">${value}</td>
  </tr>`;
}

export interface BookingMailData {
  guestEmail: string;
  guestName?: string;
  hostEmail?: string;
  spaceName: string;
  neighborhood: string;
  city: string;
  fromIso: string;
  toIso: string;
  priceCents: number;
}

export function renderBookingConfirmation(data: BookingMailData): { subject: string; html: string } {
  const lines: string[] = [];
  if (data.guestName) {
    lines.push(`<p>Hi ${escapeHtml(data.guestName)},</p>`);
  }
  lines.push(
    `<p>Your booking for <strong>${escapeHtml(data.spaceName)}</strong> is confirmed.</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">`,
    infoRow("Space", `${escapeHtml(data.spaceName)} · ${escapeHtml(data.neighborhood)}, ${escapeHtml(data.city)}`),
    infoRow("Check-in", formatLocalTime(data.fromIso)),
    infoRow("Check-out", formatLocalTime(data.toIso)),
    infoRow("Total", formatEuro(guestTotalCents(data.priceCents))),
    `</table>`,
    `<p style="margin-top:24px;">Show this confirmation at check-in. Enjoy the quiet.</p>`
  );
  return {
    subject: `Booking confirmed: ${data.spaceName}`,
    html: layout("You're booked — now you just show up", lines.join("\n")),
  };
}

export function renderHostNewBooking(data: BookingMailData): { subject: string; html: string } {
  const lines: string[] = [
    `<p>New booking for <strong>${escapeHtml(data.spaceName)}</strong>:</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">`,
    infoRow("Space", `${escapeHtml(data.spaceName)} · ${escapeHtml(data.neighborhood)}, ${escapeHtml(data.city)}`),
    infoRow("Check-in", formatLocalTime(data.fromIso)),
    infoRow("Check-out", formatLocalTime(data.toIso)),
    infoRow("Guest", data.guestName ? escapeHtml(data.guestName) : "—"),
    `</table>`,
    `<p style="margin-top:24px;">No check-in fuss — the guest booked your listed hours and pays online.</p>`
  ];
  return {
    subject: `You have a new booking: ${data.spaceName}`,
    html: layout("Someone booked your space", lines.join("\n")),
  };
}

export async function notifyBookingCreated(data: BookingMailData): Promise<void> {
  const jobs: Array<{ to?: string; render: () => { subject: string; html: string } }> = [];
  if (data.guestEmail) {
    jobs.push({ to: data.guestEmail, render: () => renderBookingConfirmation(data) });
  }
  if (data.hostEmail) {
    jobs.push({ to: data.hostEmail, render: () => renderHostNewBooking(data) });
  }
  await Promise.all(
    jobs.map(async (job) => {
      if (!job.to) return;
      const mail = job.render();
      await sendMail({ to: job.to as string, subject: mail.subject, html: mail.html });
    })
  );
}