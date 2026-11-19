let sessionVisitorId;

const createVisitorId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
};

export function getVisitorId() {
  try {
    const storedId = localStorage.getItem('visitorId');
    if (storedId) return storedId;

    const visitorId = createVisitorId();
    localStorage.setItem('visitorId', visitorId);
    return visitorId;
  } catch {
    if (!sessionVisitorId) sessionVisitorId = createVisitorId();
    return sessionVisitorId;
  }
}
