// Endpoint to create worker portfolio

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proSchema } from "@/lib/validation";


const LICENSE_ENUM = {
  tesda: "TESDA",
  prc: "PRC",
  dti: "DTI",
  permit: "PERMIT",
  other: "OTHER",
} as const;
const RATE_ENUM = { hour: "HOUR", day: "DAY", job: "JOB" } as const;
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = proSchema.safeParse(body);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      errors[key] ??= issue.message;
    }
    return NextResponse.json({ errors }, { status: 400 });
  }

  const d = parsed.data;
  const isBiz = d.kind === "business";

  try {
    const pro = await prisma.pro.create({
      data: {
        kind: isBiz ? "BUSINESS" : "INDIVIDUAL",
        // Business-only fields are dropped for individuals.
        businessName: isBiz ? d.businessName || null : null,
        teamSize: isBiz ? d.teamSize : null,
        address: isBiz ? d.address || null : null,
        ownerName: d.ownerName,
        trade: d.trade,
        yearsExperience: d.years,
        area: d.area,
        about: d.about || null,
        phone: d.phone,
        altPhone: d.altPhone || null,
        email: d.email || null,
        messenger: d.messenger || null,
        emergency: d.emergency,
        rateMin: d.rateMin,
        rateMax: d.rateMax,
        rateUnit: RATE_ENUM[d.rateUnit],
        schedule: {
          create: d.schedule.map((s, i) => ({
            dayOfWeek: i,
            open: s.open,
            fromTime: s.from,
            toTime: s.to,
          })),
        },
        licenses: {
          create: d.licenses
            .filter((l) => isBiz || l.type !== "dti")
            .map((l) => ({
              type: LICENSE_ENUM[l.type],
              title: l.title,
              number: l.number || null,
              expiry: l.expiry || null,
            })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: pro.id }, { status: 201 });
  } catch (err) {
    console.error("Failed to create pro", err);
    return NextResponse.json(
      { errors: { form: "We couldn't save your portfolio. Please try again." } },
      { status: 500 }
    );
  }
}