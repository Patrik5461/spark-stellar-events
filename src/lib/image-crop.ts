export function autoCropBlackBars(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Nepodarilo sa vytvoriť 2D kontext"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // A pixel is considered part of a black bar if it is nearly black
      // or nearly transparent.
      const isBlackish = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return a < 30 || (r < 20 && g < 20 && b < 20);
      };

      let top = 0;
      for (let y = 0; y < h; y++) {
        let allBlack = true;
        for (let x = 0; x < w; x++) {
          if (!isBlackish((y * w + x) * 4)) {
            allBlack = false;
            break;
          }
        }
        if (!allBlack) {
          top = y;
          break;
        }
      }

      let bottom = h;
      for (let y = h - 1; y >= 0; y--) {
        let allBlack = true;
        for (let x = 0; x < w; x++) {
          if (!isBlackish((y * w + x) * 4)) {
            allBlack = false;
            break;
          }
        }
        if (!allBlack) {
          bottom = y + 1;
          break;
        }
      }

      let left = 0;
      for (let x = 0; x < w; x++) {
        let allBlack = true;
        for (let y = 0; y < h; y++) {
          if (!isBlackish((y * w + x) * 4)) {
            allBlack = false;
            break;
          }
        }
        if (!allBlack) {
          left = x;
          break;
        }
      }

      let right = w;
      for (let x = w - 1; x >= 0; x--) {
        let allBlack = true;
        for (let y = 0; y < h; y++) {
          if (!isBlackish((y * w + x) * 4)) {
            allBlack = false;
            break;
          }
        }
        if (!allBlack) {
          right = x + 1;
          break;
        }
      }

      if (top === 0 && bottom === h && left === 0 && right === w) {
        // Nothing to crop.
        resolve(file);
        return;
      }

      const cropW = right - left;
      const cropH = bottom - top;
      if (cropW <= 0 || cropH <= 0) {
        resolve(file);
        return;
      }

      const out = document.createElement("canvas");
      out.width = cropW;
      out.height = cropH;
      const outCtx = out.getContext("2d");
      outCtx?.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = outType === "image/jpeg" ? 0.92 : undefined;

      out.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Nepodarilo sa exportovať orezaný obrázok"));
            return;
          }
          const ext = outType === "image/png" ? "png" : "jpg";
          const base = file.name.replace(/\.[^/.]+$/, "");
          const name = `${base}-orezane.${ext}`;
          resolve(new File([blob], name, { type: outType }));
        },
        outType,
        quality,
      );
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e instanceof Error ? e : new Error("Načítanie fotografie zlyhalo"));
    };

    img.src = objectUrl;
  });
}
