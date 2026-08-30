import { getAirport } from "../data/airports";
import type {
  AirportCode,
  FlightOffer,
  SearchCriteria,
  SortOption,
} from "../types/flight";

export function isCrossCountryRoute(
  origin: AirportCode,
  destination: AirportCode,
): boolean {
  return getAirport(origin).country !== getAirport(destination).country;
}

export function validateCriteria(
  criteria: SearchCriteria,
  today = new Date().toISOString().slice(0, 10),
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isCrossCountryRoute(criteria.origin, criteria.destination)) {
    errors.destination = "起訖機場必須分屬台灣與日本";
  }
  if (criteria.departureDate < today) {
    errors.departureDate = "去程日期不可早於今天";
  }
  if (criteria.tripType === "roundTrip" && !criteria.returnDate) {
    errors.returnDate = "請選擇回程日期";
  }
  if (
    criteria.tripType === "roundTrip" &&
    criteria.returnDate &&
    criteria.returnDate < criteria.departureDate
  ) {
    errors.returnDate = "回程日期不可早於去程日期";
  }
  if (criteria.adults < 1 || criteria.adults > 9) {
    errors.adults = "成人乘客數必須介於 1 到 9";
  }

  return errors;
}

export function filterOffers(
  offers: readonly FlightOffer[],
  criteria: SearchCriteria,
): FlightOffer[] {
  return offers.filter(
    (offer) =>
      offer.outbound.origin === criteria.origin &&
      offer.outbound.destination === criteria.destination &&
      (!criteria.directOnly || offer.outbound.stops === 0) &&
      (criteria.tripType === "oneWay" || Boolean(offer.inbound)),
  );
}

export function sortOffers(
  offers: readonly FlightOffer[],
  option: SortOption,
): FlightOffer[] {
  return [...offers].sort((a, b) => {
    if (option === "price") return a.priceTwd - b.priceTwd;
    if (option === "duration") {
      return a.outbound.durationMinutes - b.outbound.durationMinutes;
    }
    return a.outbound.departureAt.localeCompare(b.outbound.departureAt);
  });
}
