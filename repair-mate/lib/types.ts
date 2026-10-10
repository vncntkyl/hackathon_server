export type Pro = {
  id: string;
  createdAt: string;
  name: string;
  business: string;
  trade: string;
  phone: string;
  email: string;
  area: string;
  years: number;
  licensed: boolean;
  about: string;
  rate: string | null; 
};
export type ProInput = Omit<Pro, "id" | "createdAt">;

export type RepairRequest = {
  id: string;
  createdAt: string;
  issue: string;
  trade: string;
  area: string;
  urgency: string;
  name: string;
  phone: string;
};
export type RepairRequestInput = Omit<RepairRequest, "id" | "createdAt">;

export type Database = { pros: Pro[]; requests: RepairRequest[] };