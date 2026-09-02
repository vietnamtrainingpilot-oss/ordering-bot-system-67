// PTC Order Bot — Configuration
//
// Centralized configuration. Values are read from environment variables
// (see `.env` / `.env.example`). Channel and role IDs can alternatively be
// hardcoded here for quick testing.
//
// All colors are Discord embed colors. EMBED is the default embed color;
// SUCCESS / WARNING / ERROR are used for order lifecycle states.

const COLORS = {
  EMBED: 0x2f3136,      // default embed color (brand dark)
  SUCCESS: 0x57f287,    // green - completed orders
  WARNING: 0xfee75c,    // yellow - pending/processing
  ERROR: 0xed4245,      // red - denied/errors
  INFO: 0x5865f2,       // blurple - information
  BRAND: 0x1e90ff,      // PTC brand blue (accent)
};

// Buttons shown on the staff order card
const STAFF_ACTION = {
  COMPLETE: 'order_complete',
  DENY: 'order_deny',
  ASK_MORE: 'order_ask_more',
};

// Buttons shown on the customer-facing order embed
const CUSTOMER_ACTION = {
  ORDER: 'p_342161678223282177', // matches the provided JSON custom_id
};

// Modal custom IDs
const MODALS = {
  ORDER_FORM: 'order_form_modal',
  COMPLETE_FORM: 'order_complete_modal',
  DENY_FORM: 'order_deny_modal',
};

module.exports = {
  COLORS,
  STAFF_ACTION,
  CUSTOMER_ACTION,
  MODALS,
};
