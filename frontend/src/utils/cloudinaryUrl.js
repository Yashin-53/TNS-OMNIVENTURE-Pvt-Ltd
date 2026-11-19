const presets = {
  card: 'w_640,c_limit,q_auto,f_auto',
  detail: 'w_1280,c_limit,q_auto,f_auto',
  thumb: 'w_200,h_140,c_fill,q_auto,f_auto',
};

export function optimizeUrl(url, preset) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('/video/upload/')) return url;
  if (!presets[preset]) return url;
  return url.replace('/upload/', `/upload/${presets[preset]}/`);
}
