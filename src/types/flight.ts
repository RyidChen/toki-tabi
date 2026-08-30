export type CountryCode = "TW" | "JP";
export type TripType = "oneWay" | "roundTrip";
export type SortOption = "price" | "duration" | "departure";

export type AirportCode =
  | "TPE"
  | "TSA"
  | "KHH"
  | "RMQ"
  | "NRT"
  | "HND"
  | "KIX"
  | "NGO"
  | "FUK"
  | "CTS";

export interface Airport {
  code: AirportCode;
  name: string;
  city: string;
  country: CountryCode;
}

export interface SearchCriteria {
  tripType: TripType;
  origin: AirportCode;
  destination: AirportCode;
  departureDate: string;
  returnDate?: string;
  adults: number;
  directOnly: boolean;
}

export interface FlightSegment {
  origin: AirportCode;
  destination: AirportCode;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
}

export interface FlightOffer {
  id: string;
  airlineCode: string;
  airlineName: string;
  priceTwd: number;
  outbound: FlightSegment;
  inbound?: FlightSegment;
}

export type SearchFlights = (
  criteria: SearchCriteria,
) => Promise<FlightOffer[]>;
