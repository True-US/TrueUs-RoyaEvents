import {
  COVER_CONTENT_TYPE,
  COVER_HEIGHT,
  COVER_MAX_BYTES,
  COVER_MIN_SOURCE_HEIGHT,
  COVER_MIN_SOURCE_WIDTH,
  COVER_WIDTH,
} from "@/features/events/constants";

// Browser only: turns any photo the admin picks into a cover the server
// accepts. Doing this before upload keeps uploads small (a 5 MB phone photo
// becomes ~200-400 KB) and gives every cover the same shape.

// WebP quality steps to try, best first, until the file fits COVER_MAX_BYTES.
const QUALITY_STEPS: number[] = [0.85, 0.75, 0.65];

/**
 * Crops a photo to the cover's 2:1 shape (keeping the centre), resizes it to
 * COVER_WIDTH x COVER_HEIGHT and encodes it as WebP.
 * @param file The image the admin picked.
 * @returns A WebP File ready to upload.
 */
export async function prepareCoverImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPEG, PNG, WebP...).");
  }

  // Decodes the image; also applies phone photos' EXIF rotation.
  const bitmap: ImageBitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image can't be read. Try a JPEG or PNG.");
  });

  try {
    if (bitmap.width < COVER_MIN_SOURCE_WIDTH || bitmap.height < COVER_MIN_SOURCE_HEIGHT) {
      throw new Error(
        `The image is too small (${bitmap.width}x${bitmap.height}). Use at least ${COVER_MIN_SOURCE_WIDTH}x${COVER_MIN_SOURCE_HEIGHT}.`,
      );
    }

    const canvas: HTMLCanvasElement = drawCenterCrop(bitmap);

    for (const quality of QUALITY_STEPS) {
      const blob: Blob | null = await toBlob(canvas, quality);
      // Browsers that can't encode WebP (older Safari) silently return PNG.
      if (!blob || blob.type !== COVER_CONTENT_TYPE) {
        throw new Error("This browser can't create WebP images. Use a recent Chrome, Edge or Firefox.");
      }
      if (blob.size <= COVER_MAX_BYTES) {
        return new File([blob], "cover.webp", { type: COVER_CONTENT_TYPE });
      }
    }

    throw new Error("The image is too detailed to fit 2 MB. Try a different photo.");
  } finally {
    // Free the decoded image's memory.
    bitmap.close();
  }
}

/**
 * Draws the largest centred 2:1 area of the image onto a cover-sized canvas.
 * @param bitmap The decoded image.
 * @returns The canvas holding the cropped, resized image.
 */
function drawCenterCrop(bitmap: ImageBitmap): HTMLCanvasElement {
  const targetRatio: number = COVER_WIDTH / COVER_HEIGHT;

  // Source rectangle: full height for wide images, full width for tall ones.
  let sourceWidth: number = bitmap.width;
  let sourceHeight: number = bitmap.height;
  if (sourceWidth / sourceHeight > targetRatio) {
    sourceWidth = sourceHeight * targetRatio;
  } else {
    sourceHeight = sourceWidth / targetRatio;
  }
  const sourceX: number = (bitmap.width - sourceWidth) / 2;
  const sourceY: number = (bitmap.height - sourceHeight) / 2;

  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = COVER_WIDTH;
  canvas.height = COVER_HEIGHT;

  const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser can't process images.");
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, COVER_WIDTH, COVER_HEIGHT);

  return canvas;
}

/**
 * Promise wrapper around canvas.toBlob.
 * @param canvas The canvas to encode.
 * @param quality WebP quality, 0 to 1.
 * @returns The encoded image, or null if encoding failed.
 */
function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve: (blob: Blob | null) => void) => {
    canvas.toBlob(resolve, COVER_CONTENT_TYPE, quality);
  });
}
