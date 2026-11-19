export function checkVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(duration)) {
        reject(new Error(`Could not read “${file.name}”.`));
      } else {
        resolve(duration);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read “${file.name}”.`));
    };
    video.src = url;
  });
}
