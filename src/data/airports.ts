import type { Airport, AirportCode } from "../types/flight";

export const TAIWAN_AIRPORTS = [
  { code: "TPE", name: "桃園國際機場", city: "台北", country: "TW" },
  { code: "TSA", name: "台北松山機場", city: "台北", country: "TW" },
  { code: "KHH", name: "高雄國際機場", city: "高雄", country: "TW" },
  { code: "RMQ", name: "台中國際機場", city: "台中", country: "TW" },
] as const satisfies readonly Airport[];

export const JAPAN_AIRPORTS = [
  { code: "NRT", name: "成田國際機場", city: "東京", country: "JP" },
  { code: "HND", name: "羽田機場", city: "東京", country: "JP" },
  { code: "KIX", name: "關西國際機場", city: "大阪", country: "JP" },
  { code: "NGO", name: "中部國際機場", city: "名古屋", country: "JP" },
  { code: "FUK", name: "福岡機場", city: "福岡", country: "JP" },
  { code: "CTS", name: "新千歲機場", city: "札幌", country: "JP" },
] as const satisfies readonly Airport[];

export const AIRPORTS: readonly Airport[] = [
  ...TAIWAN_AIRPORTS,
  ...JAPAN_AIRPORTS,
];

export function getAirport(code: AirportCode): Airport {
  const airport = AIRPORTS.find((item) => item.code === code);
  if (!airport) throw new Error(`Unknown airport: ${code}`);
  return airport;
}
