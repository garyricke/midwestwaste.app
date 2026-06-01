export type DumpsterSize = {
  size: string;
  label: string;
  description: string;
  price_cents: number;
  sort_order: number;
  active: boolean;
};

export type Hauler = {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number;
  longitude: number;
  service_radius_miles: number;
  active: boolean;
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "assigned"
  | "notified"
  | "needs_manual_assignment"
  | "failed";

export type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  dumpster_size: string;
  amount_cents: number;
  requested_delivery_date: string | null;
  notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  assigned_hauler_id: string | null;
  distance_miles: number | null;
};
