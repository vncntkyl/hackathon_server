
import Dexie, { type Table } from "dexie";

export interface LocalPro {
  id: string;
  kind: "BUSINESS" | "INDIVIDUAL";
  displayName: string;
  businessName: string | null;
  teamSize: number | null;
  trade: string;
  yearsExperience: number | null;
  area: string;
  about: string | null;
  emergency: boolean;
  rateMin: number | null;
  rateMax: number | null;
  rateUnit: "HOUR" | "DAY" | "JOB" | null;
  updatedAt: string;
  phone: string | null;
  altPhone: string | null;
  messenger: string | null;
  schedule: {
    dayOfWeek: number;
    open: boolean;
    fromTime: string;
    toTime: string;
  }[];
  licenses: {
    type: "TESDA" | "PRC" | "DTI" | "PERMIT" | "OTHER";
    title: string;
    verified: boolean;
  }[];
}

interface LocalMeta {
  key: string;
  value: string;
}

class RepairDatabase extends Dexie {
  workers!: Table<LocalPro, string>;
  meta!: Table<LocalMeta, string>;

  constructor() {
    super("repairDatabase");

    this.version(1).stores({
      workers: "id, trade, area, emergency, rateMin, rateMax",
      meta: "key",
    });
  }
}

export const db = new RepairDatabase();