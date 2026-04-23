// Runtime config — se carga desde public/config.js antes del bundle.
// Fallback a variables de entorno para compatibilidad con deploys existentes.
const r = window.__APP_CONFIG__ ?? {};

export const BUSINESS_ID    = r.businessId    ?? import.meta.env.VITE_BUSINESS_ID;
export const WHATSAPP_PHONE = r.whatsappPhone ?? import.meta.env.VITE_WHATSAPP_PHONE;
export const SITE_URL       = r.siteUrl       ?? import.meta.env.VITE_SITE_URL ?? window.location.origin;
export const ADMIN_EMAIL    = r.adminEmail    ?? import.meta.env.VITE_ADMIN_EMAIL;
