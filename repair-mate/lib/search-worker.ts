
import { db } from "@/lib/offline-db";
import { servesCity } from "@/lib/location";

export async function searchPros(options: {
  trade: string;
  area: string;
  budget?: number;
}) {
  const trade = options.trade.trim().toLowerCase();

  // The trade index narrows the initial query.
  const candidates = await db.workers
    .where("trade")
    .equalsIgnoreCase(trade)
    .toArray();

  return candidates
    .filter((pro) => {
      if (!servesCity(pro.area, options.area)) {
        return false;
      }

      if (options.budget == null) {
        return true;
      }

      // Unknown rates should not be treated as within budget.
      if (pro.rateMin == null) {
        return false;
      }

      // A rate range overlaps the budget if its minimum
      // doesn't exceed the budget. This is only a rough filter.
      return pro.rateMin <= options.budget;
    })
    .sort((a, b) => {
      if (a.rateMin == null) return 1;
      if (b.rateMin == null) return -1;
      return a.rateMin - b.rateMin;
    });
}
