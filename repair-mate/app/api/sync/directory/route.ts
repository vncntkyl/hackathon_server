
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pros = await prisma.pro.findMany({
    //   where: {
    //     isPublished: true,
    //   },
      select: {
        id: true,
        kind: true,
        businessName: true,
        ownerName: true,
        teamSize: true,
        trade: true,
        yearsExperience: true,
        area: true,
        about: true,
        emergency: true,
        rateMin: true,
        rateMax: true,
        rateUnit: true,
        updatedAt: true,
        //publicContact: true,
        phone: true,
        altPhone: true,
        messenger: true,

        schedule: {
          select: {
            dayOfWeek: true,
            open: true,
            fromTime: true,
            toTime: true,
          },
        },

        licenses: {
          select: {
            type: true,
            title: true,
            verified: true,
            // Intentionally omit number and expiry
            // unless you have a clear public-display policy.
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const workers = pros.map((pro) => ({
      id: pro.id,
      kind: pro.kind,
      displayName:
        pro.kind === "BUSINESS"
          ? pro.businessName || pro.ownerName
          : pro.ownerName,
      businessName: pro.businessName,
      teamSize: pro.teamSize,
      trade: pro.trade,
      yearsExperience: pro.yearsExperience,
      area: pro.area,
      about: pro.about,
      emergency: pro.emergency,
      rateMin: pro.rateMin,
      rateMax: pro.rateMax,
      rateUnit: pro.rateUnit,
      updatedAt: pro.updatedAt.toISOString(),

      phone: pro.phone ? pro.phone : null,
      // Include contact details only with explicit consent.
    //   altPhone: pro.publicContact ? pro.altPhone : null,
    //   messenger: pro.publicContact ? pro.messenger : null,

      schedule: pro.schedule,
      licenses: pro.licenses,
    }));

    return NextResponse.json({
      schemaVersion: 1,
      syncedAt: new Date().toISOString(),
      workers,
    });
  } catch (error) {
    console.error("Directory sync failed", error);

    return NextResponse.json(
      { error: "Unable to sync directory" },
      { status: 500 },
    );
  }
}