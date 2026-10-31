export const PROPERTY_TYPES = [
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot / Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'farmland', label: 'Farmland' },
];

export const AMENITIES = [
  'Parking', 'Power backup', 'Lift', '24x7 security', 'Water supply', 'Park / garden',
  'Gym', 'Swimming pool', 'Clubhouse', 'CCTV', 'Gated community', 'Near metro / bus stop',
];

export const typeLabel = (value) => PROPERTY_TYPES.find((t) => t.value === value)?.label || value;

// Hero banner slides. Replace images/text with real ads later (or load them from the API).
export const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1800&q=70',
    title: 'Homes you can visit this weekend',
    text: 'Talk to the owner directly. No middlemen, no hidden brokerage.',
    cta: { label: 'Browse homes for sale', to: '/?listingType=sale#listings' },
  },
  {
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=70',
    title: 'Plots and farmland, clear titles only',
    text: 'Compare land by price, size and location in your preferred unit.',
    cta: { label: 'Explore plots', to: '/?type=plot#listings' },
  },
  {
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=70',
    title: 'Selling a property? Post it in minutes',
    text: 'Add photos, a video and your price with taxes. Buyers reach you directly.',
    cta: { label: 'Post your property', to: '/post-property' },
  },
  {
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=70',
    title: 'Looking for a rental?',
    text: 'Furnished flats and family homes, listed by the people who own them.',
    cta: { label: 'See rentals', to: '/?listingType=rent#listings' },
  },
];
