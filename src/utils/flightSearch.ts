import { getAirport } from "../data/airports";
import { dateInputValue, isValidDate } from "./date";
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
  today = dateInputValue(new Date()),
): Record<string, string> {
  // 以欄位名稱作為 key，讓表單能將訊息顯示在對應欄位旁。
  const errors: Record<string, string> = {};

  if (!isCrossCountryRoute(criteria.origin, criteria.destination)) {
    errors.destination = "起訖機場必須分屬台灣與日本";
  }
  if (!isValidDate(criteria.departureDate)) {
    errors.departureDate = "請選擇有效的去程日期";
  } else if (criteria.departureDate < today) {
    errors.departureDate = "去程日期不可早於今天";
  }
  if (criteria.tripType === "roundTrip") {
    if (!isValidDate(criteria.returnDate)) {
      errors.returnDate = "請選擇有效的回程日期";
    } else if (criteria.returnDate < criteria.departureDate) {
      errors.returnDate = "回程日期不可早於去程日期";
    }
  }
  if (
    !Number.isInteger(criteria.adults) ||
    criteria.adults < 1 ||
    criteria.adults > 9
  ) {
    errors.adults = "成人乘客數必須是 1 到 9 的整數";
  }

  return errors;
}

export function filterOffers(
  offers: readonly FlightOffer[],
  criteria: SearchCriteria,
): FlightOffer[] {
  // 展示資料未依日期切分，目前只篩選航線、直飛條件與是否包含回程。
  return offers.filter(({ outbound, inbound }) => {
    if (
      outbound.origin !== criteria.origin ||
      outbound.destination !== criteria.destination
    ) {
      return false;
    }
    if (criteria.tripType === "roundTrip" && !inbound) return false;

    if (criteria.directOnly) {
      if (outbound.stops !== 0) return false;
      if (criteria.tripType === "roundTrip" && inbound?.stops !== 0)
        return false;
    }

    return true;
  });
}

export function sortOffers(
  offers: readonly FlightOffer[],
  option: SortOption,
): FlightOffer[] {
  // 先複製陣列，避免 Array.sort() 直接改動 Vue 正在追蹤的原始資料。
  return [...offers].sort((a, b) => {
    if (option === "price") return a.priceTwd - b.priceTwd;
    if (option === "duration") {
      return a.outbound.durationMinutes - b.outbound.durationMinutes;
    }
    return a.outbound.departureAt.localeCompare(b.outbound.departureAt);
  });
}
