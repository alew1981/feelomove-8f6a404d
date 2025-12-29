/**
 * Utility functions for festival-specific data handling
 */

import { FestivalProductPage } from "@/types/events.types";

/**
 * Formats a date range for festivals
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Formatted string like "2-4 julio 2026"
 */
export function formatFestivalDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];
  const year = start.getFullYear();
  
  if (startDay === endDay && start.getMonth() === end.getMonth()) {
    return `${startDay} ${startMonth} ${year}`;
  }
  
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  }
  
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

/**
 * Gets descriptive duration text
 * @param days - Number of days
 * @returns "1 día", "3 días", etc.
 */
export function getFestivalDurationText(days: number): string {
  return days === 1 ? "1 día" : `${days} días`;
}

/**
 * Gets available services for a festival
 * @param festival - Festival product page object
 * @returns Array of service objects with icon and label
 */
export function getFestivalServices(festival: FestivalProductPage) {
  const services: Array<{ icon: string; label: string; available: boolean }> = [];
  
  if (festival.festival_camping_available) {
    services.push({
      icon: "⛺",
      label: "Camping",
      available: true
    });
  }
  
  if (festival.festival_has_official_transport) {
    services.push({
      icon: "🚌",
      label: "Transporte oficial",
      available: true
    });
  }
  
  if (festival.has_festival_pass) {
    services.push({
      icon: "🎫",
      label: "Abonos",
      available: true
    });
  }
  
  if (festival.has_daily_tickets) {
    services.push({
      icon: "📅",
      label: "Entradas por día",
      available: true
    });
  }
  
  if (festival.has_camping_tickets) {
    services.push({
      icon: "🏕️",
      label: "Tickets de camping",
      available: true
    });
  }
  
  if (festival.has_parking_tickets) {
    services.push({
      icon: "🅿️",
      label: "Parking",
      available: true
    });
  }
  
  if (festival.festival_total_stages && festival.festival_total_stages > 1) {
    services.push({
      icon: "🎪",
      label: `${festival.festival_total_stages} escenarios`,
      available: true
    });
  }
  
  return services;
}

/**
 * Determines if a festival is multi-day
 * @param festival - Festival product page object
 * @returns boolean
 */
export function isMultiDayFestival(festival: FestivalProductPage): boolean {
  return festival.festival_duration_days > 1;
}

/**
 * Formats headliners for display
 * @param headliners - Array of headliner names
 * @param maxToShow - Maximum number to show before "y X más"
 * @returns Formatted string
 */
export function formatHeadliners(headliners: string[] | null, maxToShow = 3): string {
  if (!headliners || headliners.length === 0) return "Lineup por confirmar";
  
  const shown = headliners.slice(0, maxToShow);
  const remaining = headliners.length - maxToShow;
  
  if (remaining > 0) {
    return `${shown.join(", ")} y ${remaining} más`;
  }
  
  return shown.join(", ");
}

/**
 * Gets festival badge list based on festival-specific data
 * @param festival - Festival product page object
 * @returns Array of badge strings
 */
export function getFestivalBadges(festival: FestivalProductPage): string[] {
  const badges: string[] = [];
  
  if (festival.festival_duration_days > 1) {
    badges.push(`${festival.festival_duration_days} DÍAS`);
  }
  
  if (festival.festival_total_artists && festival.festival_total_artists > 0) {
    badges.push(`${festival.festival_total_artists} ARTISTAS`);
  }
  
  if (festival.festival_camping_available) {
    badges.push("CAMPING");
  }
  
  if (festival.festival_has_official_transport) {
    badges.push("TRANSPORTE");
  }
  
  if (festival.has_vip_tickets) {
    badges.push("VIP");
  }
  
  if (festival.has_festival_pass) {
    badges.push("ABONOS");
  }
  
  return badges;
}
