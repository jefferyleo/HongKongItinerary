export type Category = "food" | "drink" | "dessert" | "sight" | "transit" | "hotel" | "event";

export type SlotKey =
  | "transit"
  | "checkin"
  | "checkout"
  | "breakfast"
  | "brunch"
  | "lunch"
  | "snack"
  | "dinner"
  | "dessert"
  | "drinks"
  | "coffee"
  | "activity"
  | "sightseeing"
  | "rest"
  | "event"
  | "shopping";

export interface Place {
  id: string;
  name_zh: string;
  name_en: string;
  category: Category;
  description_en?: string;
  description_zh?: string;
  address?: string;
  mrt_en?: string;
  mrt_zh?: string;
  exit?: string;
  hours?: string;
  gmaps_query?: string;
  citation?: string;
}

export interface ItineraryItem {
  id: string;
  day: number; // 1..7
  position: number; // ordering within the day
  slot: SlotKey;
  time_hint?: string; // "13:30"
  place_id?: string | null; // FK -> places.id
  custom_title_en?: string;
  custom_title_zh?: string;
  custom_note_en?: string;
  custom_note_zh?: string;
}
