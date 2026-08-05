import { useState, useEffect, useRef } from 'react';

export const generateSequenceUrls = (folder, count = 120) => {
  const urls = [];
  for (let i = 1; i <= count; i++) {
    const frameNum = String(i).padStart(3, '0');
    urls.push(`/${folder}/ezgif-frame-${frameNum}.jpg`);
  }
  return urls;
};

export default function useImagePreloader(sequenceUrls, batchSize = 15) {
  const imagesRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!sequenceUrls || sequenceUrls.length === 0) return;

    let isCancelled = false;
    const total = sequenceUrls.length;
    const loadedImages = new Array(total);
    let loadedCount = 0;

    // Load first frame immediately
    const firstImg = new Image();
    firstImg.onload = firstImg.onerror = () => {
      if (isCancelled) return;
      loadedImages[0] = firstImg;
      imagesRef.current = loadedImages;
      setIsLoaded(true);
    };
    firstImg.src = sequenceUrls[0];
    if (firstImg.complete) {
      loadedImages[0] = firstImg;
      imagesRef.current = loadedImages;
      setIsLoaded(true);
    }

    // Load remaining frames in background batches of batchSize
    const loadBatch = async (startIndex) => {
      if (isCancelled || startIndex >= total) return;

      const endIndex = Math.min(startIndex + batchSize, total);
      const promises = [];

      for (let i = startIndex; i < endIndex; i++) {
        if (i === 0 && loadedImages[0]) continue;

        promises.push(
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => {
              loadedImages[i] = img;
              loadedCount += 1;
              resolve();
            };
            img.src = sequenceUrls[i];
            if (img.complete) {
              loadedImages[i] = img;
              loadedCount += 1;
              resolve();
            }
          })
        );
      }

      await Promise.all(promises);

      if (!isCancelled) {
        imagesRef.current = loadedImages;
        const currentPct = Math.round((loadedCount / total) * 100);
        setProgress(currentPct);

        if (loadedCount >= total) {
          setIsLoaded(true);
        } else {
          // Yield to main thread between batches
          setTimeout(() => loadBatch(endIndex), 15);
        }
      }
    };

    loadBatch(0);

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(sequenceUrls)]);

  return { images: imagesRef.current, isLoaded, progress };
}
