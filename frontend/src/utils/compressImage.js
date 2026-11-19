import { IMAGE_MAX_EDGE, IMAGE_TARGET_MB } from '../data/mediaLimits';

const loadBitmap = async (file) => {
  if ('createImageBitmap' in window) {
    try {
      return { bitmap: await createImageBitmap(file), width: null, height: null };
    } catch {
      // Fall through to the Image element.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Could not read “${file.name}”.`));
      element.src = url;
    });
    return { bitmap: image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
};

export async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`“${file.name}” is not a supported image.`);

  const loaded = await loadBitmap(file);
  const source = loaded.bitmap;
  const naturalWidth = loaded.width || source.width;
  const naturalHeight = loaded.height || source.height;

  if (file.size <= IMAGE_TARGET_MB * 1024 * 1024 && Math.max(naturalWidth, naturalHeight) <= IMAGE_MAX_EDGE) {
    if (source.close) source.close();
    return file;
  }

  let width = naturalWidth;
  let height = naturalHeight;
  const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  try {
    for (let round = 0; round < 5; round += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error(`Could not compress “${file.name}”.`);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      context.drawImage(source, 0, 0, width, height);

      let blob = null;
      for (let quality = 0.82; quality >= 0.6 - 0.0001; quality -= 0.055) {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= IMAGE_TARGET_MB * 1024 * 1024) break;
      }
      if (!blob) throw new Error(`Could not compress “${file.name}”.`);
      if (blob.size <= IMAGE_TARGET_MB * 1024 * 1024) {
        return new File([blob], file.name, { type: 'image/jpeg' });
      }
      width = Math.max(1, Math.round(width * 0.85));
      height = Math.max(1, Math.round(height * 0.85));
    }
    throw new Error(`Could not compress “${file.name}” to under 1 MB without losing too much quality.`);
  } finally {
    if (source.close) source.close();
  }
}
