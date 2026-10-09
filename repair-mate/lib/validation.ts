import { z } from "zod";
import { TRADES } from "@/lib/mock";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time.");
const opt = (max: number) => z.string().trim().max(max).default("");

export const proSchema = z
  .object({
    kind: z.enum(["business", "individual"]),
    businessName: opt(100),
    ownerName: z.string().trim().min(1, "Enter the name.").max(80),
    teamSize: z.number().int().min(1).max(500).nullable().default(null),
    trade: z.string().refine((v) => TRADES.some((t) => t.id === v), "Choose a trade."),
    years: z.number().int().min(0).max(60).nullable().default(null),
    area: z.string().trim().min(1, "Enter the area you serve.").max(150),
    about: opt(500),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a valid phone number."),
    altPhone: opt(30),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email.")
      .default(""),
    messenger: opt(150),
    address: opt(200),
    emergency: z.boolean().default(false),
    rateMin: z.number().int().min(1, "Enter your lowest labor fee.").max(1_000_000),
    rateMax: z.number().int().min(1).max(1_000_000).nullable().default(null),
    rateUnit: z.enum(["hour", "day", "job"]),
    schedule: z.array(z.object({ open: z.boolean(), from: time, to: time })).length(7),
    licenses: z
      .array(
        z.object({
          type: z.enum(["tesda", "prc", "dti", "permit", "other"]),
          title: z.string().trim().min(1, "Enter the license name.").max(150),
          number: opt(60),
          expiry: z
            .string()
            .trim()
            .regex(/^(\d{4}-\d{2})?$/, "Invalid date.")
            .default(""),
        })
      )
      .max(20),
  })
  .superRefine((d, ctx) => {
    if (d.kind === "business" && !d.businessName) {
      ctx.addIssue({ code: "custom", path: ["businessName"], message: "Enter your business name." });
    }
    if (!d.schedule.some((s) => s.open)) {
      ctx.addIssue({ code: "custom", path: ["schedule"], message: "Select at least one working day." });
    }
    if (d.rateMax !== null && d.rateMax < d.rateMin) {
    ctx.addIssue({ code: "custom", path: ["rateMax"], message: "Highest fee must be equal to or more than the lowest." });
    }
    d.schedule.forEach((s, i) => {
      if (s.open && s.to <= s.from) {
        ctx.addIssue({ code: "custom", path: ["schedule", i], message: "Closing time must be after opening time." });
      }
    });
  });