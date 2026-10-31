// Short price for cards: 45 Lakh, 1.25 Cr
export const formatPrice = (n = 0) => {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} Lakh`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

// Full price: ₹45,00,000
export const formatFull = (n = 0) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Base price + each tax line + total
export const getPriceBreakdown = (price = 0, taxes = {}) => {
  const lines = [
    { label: 'Stamp duty', percent: taxes.stampDuty || 0 },
    { label: 'Registration', percent: taxes.registration || 0 },
    { label: 'GST', percent: taxes.gst || 0 },
  ].map((line) => ({ ...line, amount: Math.round((price * line.percent) / 100) }));
  const total = price + lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total };
};

export const cityState = (location = {}) => [location.city, location.state].filter(Boolean).join(', ');

export const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#D5EEEA"/><path d="M180 260h240M210 260c0-50 40-80 90-80s90 30 90 80" fill="none" stroke="#0F766E" stroke-width="12" stroke-linecap="round"/></svg>'
  );
