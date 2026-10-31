// factor = how many sq. ft in one unit
export const UNITS = [
  { value: 'sqft', label: 'Sq. ft', factor: 1 },
  { value: 'sqm', label: 'Sq. m', factor: 10.7639 },
  { value: 'sqyd', label: 'Sq. yd (gaj)', factor: 9 },
  { value: 'acre', label: 'Acre', factor: 43560 },
  { value: 'hectare', label: 'Hectare', factor: 107639.1 },
];

const factorOf = (unit) => UNITS.find((u) => u.value === unit).factor;

export const convertArea = (area, from, to) => (area * factorOf(from)) / factorOf(to);

export const formatArea = (n) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: n < 10 ? 3 : 2 });

export const unitLabel = (unit) => UNITS.find((u) => u.value === unit)?.label || unit;
