import { getAirport } from "./airports";
import { filterOffers } from "../utils/flightSearch";
import type {
  AirportCode,
  FlightOffer,
  FlightSegment,
  SearchCriteria,
  SearchFlights,
} from "../types/flight";

interface RouteTemplate {
  id: string;
  origin: AirportCode;
  destination: AirportCode;
  airlineCode: string;
  airlineName: string;
  priceTwd: number;
  departureMinutes: number;
  returnDepartureMinutes: number;
  durationMinutes: number;
  stops: number;
}

const MOCK_ROUTE_TEMPLATES: readonly RouteTemplate[] = [
  {
    id: "it-tpe-nrt",
    origin: "TPE",
    destination: "NRT",
    airlineCode: "IT",
    airlineName: "台灣虎航",
    priceTwd: 5280,
    departureMinutes: 390,
    returnDepartureMinutes: 960,
    durationMinutes: 190,
    stops: 0,
  },
  {
    id: "ci-tpe-nrt",
    origin: "TPE",
    destination: "NRT",
    airlineCode: "CI",
    airlineName: "中華航空",
    priceTwd: 7680,
    departureMinutes: 510,
    returnDepartureMinutes: 840,
    durationMinutes: 185,
    stops: 0,
  },
  {
    id: "br-tpe-nrt",
    origin: "TPE",
    destination: "NRT",
    airlineCode: "BR",
    airlineName: "長榮航空",
    priceTwd: 6450,
    departureMinutes: 675,
    returnDepartureMinutes: 725,
    durationMinutes: 280,
    stops: 1,
  },
  {
    id: "mm-nrt-tpe",
    origin: "NRT",
    destination: "TPE",
    airlineCode: "MM",
    airlineName: "樂桃航空",
    priceTwd: 4980,
    departureMinutes: 540,
    returnDepartureMinutes: 780,
    durationMinutes: 235,
    stops: 0,
  },
  {
    id: "jl-nrt-tpe",
    origin: "NRT",
    destination: "TPE",
    airlineCode: "JL",
    airlineName: "日本航空",
    priceTwd: 8120,
    departureMinutes: 805,
    returnDepartureMinutes: 620,
    durationMinutes: 240,
    stops: 0,
  },
  {
    id: "ci-tsa-hnd",
    origin: "TSA",
    destination: "HND",
    airlineCode: "CI",
    airlineName: "中華航空",
    priceTwd: 8320,
    departureMinutes: 420,
    returnDepartureMinutes: 870,
    durationMinutes: 175,
    stops: 0,
  },
  {
    id: "nh-tsa-hnd",
    origin: "TSA",
    destination: "HND",
    airlineCode: "NH",
    airlineName: "全日空",
    priceTwd: 9140,
    departureMinutes: 780,
    returnDepartureMinutes: 600,
    durationMinutes: 180,
    stops: 0,
  },
  {
    id: "jl-hnd-tsa",
    origin: "HND",
    destination: "TSA",
    airlineCode: "JL",
    airlineName: "日本航空",
    priceTwd: 8750,
    departureMinutes: 660,
    returnDepartureMinutes: 480,
    durationMinutes: 220,
    stops: 0,
  },
  {
    id: "it-khh-kix",
    origin: "KHH",
    destination: "KIX",
    airlineCode: "IT",
    airlineName: "台灣虎航",
    priceTwd: 4760,
    departureMinutes: 505,
    returnDepartureMinutes: 1020,
    durationMinutes: 165,
    stops: 0,
  },
  {
    id: "mm-kix-khh",
    origin: "KIX",
    destination: "KHH",
    airlineCode: "MM",
    airlineName: "樂桃航空",
    priceTwd: 4550,
    departureMinutes: 690,
    returnDepartureMinutes: 550,
    durationMinutes: 205,
    stops: 0,
  },
  {
    id: "it-rmq-ngo",
    origin: "RMQ",
    destination: "NGO",
    airlineCode: "IT",
    airlineName: "台灣虎航",
    priceTwd: 4880,
    departureMinutes: 610,
    returnDepartureMinutes: 830,
    durationMinutes: 160,
    stops: 0,
  },
  {
    id: "jx-ngo-rmq",
    origin: "NGO",
    destination: "RMQ",
    airlineCode: "JX",
    airlineName: "星宇航空",
    priceTwd: 6920,
    departureMinutes: 750,
    returnDepartureMinutes: 590,
    durationMinutes: 200,
    stops: 0,
  },
  {
    id: "it-tpe-fuk",
    origin: "TPE",
    destination: "FUK",
    airlineCode: "IT",
    airlineName: "台灣虎航",
    priceTwd: 4380,
    departureMinutes: 460,
    returnDepartureMinutes: 880,
    durationMinutes: 135,
    stops: 0,
  },
  {
    id: "ci-fuk-tpe",
    origin: "FUK",
    destination: "TPE",
    airlineCode: "CI",
    airlineName: "中華航空",
    priceTwd: 6180,
    departureMinutes: 735,
    returnDepartureMinutes: 615,
    durationMinutes: 175,
    stops: 0,
  },
  {
    id: "jx-tpe-cts",
    origin: "TPE",
    destination: "CTS",
    airlineCode: "JX",
    airlineName: "星宇航空",
    priceTwd: 8980,
    departureMinutes: 550,
    returnDepartureMinutes: 730,
    durationMinutes: 230,
    stops: 0,
  },
  {
    id: "br-cts-tpe",
    origin: "CTS",
    destination: "TPE",
    airlineCode: "BR",
    airlineName: "長榮航空",
    priceTwd: 9260,
    departureMinutes: 800,
    returnDepartureMinutes: 540,
    durationMinutes: 285,
    stops: 0,
  },
];

function localDateTime(date: string, minutes: number, offset: string): string {
  const dayOffset = Math.floor(minutes / 1440);
  const dateValue = new Date(`${date}T00:00:00Z`);
  dateValue.setUTCDate(dateValue.getUTCDate() + dayOffset);
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const mins = (normalized % 60).toString().padStart(2, "0");
  return `${dateValue.toISOString().slice(0, 10)}T${hours}:${mins}:00${offset}`;
}

function buildSegment(
  origin: AirportCode,
  destination: AirportCode,
  date: string,
  departureMinutes: number,
  durationMinutes: number,
  stops: number,
): FlightSegment {
  const originOffset =
    getAirport(origin).country === "TW" ? "+08:00" : "+09:00";
  const destinationOffset =
    getAirport(destination).country === "TW" ? "+08:00" : "+09:00";
  const timezoneDifference = destinationOffset === "+09:00" ? 60 : -60;

  return {
    origin,
    destination,
    departureAt: localDateTime(date, departureMinutes, originOffset),
    arrivalAt: localDateTime(
      date,
      departureMinutes + durationMinutes + timezoneDifference,
      destinationOffset,
    ),
    durationMinutes,
    stops,
  };
}

function buildOffer(
  template: RouteTemplate,
  criteria: SearchCriteria,
): FlightOffer {
  return {
    id: `${template.id}-${criteria.departureDate}`,
    airlineCode: template.airlineCode,
    airlineName: template.airlineName,
    priceTwd: template.priceTwd,
    outbound: buildSegment(
      template.origin,
      template.destination,
      criteria.departureDate,
      template.departureMinutes,
      template.durationMinutes,
      template.stops,
    ),
    ...(criteria.tripType === "roundTrip" && criteria.returnDate
      ? {
          inbound: buildSegment(
            template.destination,
            template.origin,
            criteria.returnDate,
            template.returnDepartureMinutes,
            template.durationMinutes + 10,
            template.stops,
          ),
        }
      : {}),
  };
}

export const searchMockFlights: SearchFlights = async (criteria) => {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const offers = MOCK_ROUTE_TEMPLATES.map((template) =>
    buildOffer(template, criteria),
  );
  return filterOffers(offers, criteria);
};
