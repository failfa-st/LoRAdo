import fs from "node:fs/promises";
import path from "node:path";
import { ensureDirExists, getClosestSize, getImageDimensions } from "./utils";
import { cropImageToFace, loadModels } from "./crop";

export async function prepareImage({
  crop = false,
  image,
  repeats = 1,
  zoomLevels = [0],
  className,
  subject,
  outDir,
  counter,
  sizes,
}: {
  crop?: boolean;
  counter: number;
  image: string;
  repeats: number;
  zoomLevels?: number[];
  className: string;
  subject: string;
  outDir: string;
  sizes: [number, number][];
}) {
  await loadModels();

  const outFolderName = path.join(
    outDir,
    "img",
    `${repeats}_${subject} ${className}`,
  );

  await ensureDirExists(outFolderName);

  const imageInfo = await getImageDimensions(image);
  let caption: string;
  try {
    caption = await fs.readFile(image.replace(/\.jpe?g$/, ".txt"), "utf-8");
  } catch {
    caption = `portrait photo of ${subject} ${className}, best quality`;
  }
  const requestedSizes = crop
    ? sizes
    : [
        getClosestSize(
          { height: imageInfo.height!, width: imageInfo.width! },
          sizes,
        ) ?? [1024, 1024],
      ];
  const failed: string[] = [];
  let localCounter = 0;
  for (const [width, height] of requestedSizes) {
    for (const zoomLevel of zoomLevels) {
      if (!failed.includes(image)) {
        try {
          const result = await cropImageToFace(
            image,
            { width, height },
            zoomLevel,
          );
          ++localCounter;
          const imageId = `${counter.toString().padStart(4, "0")}.${localCounter
            .toString()
            .padStart(4, "0")}`;
          const outputPath = path.join(
            outFolderName,
            `${subject} (${imageId}).png`,
          );
          const captionPath = path.join(
            outFolderName,
            `${subject} (${imageId}).txt`,
          );

          await fs.writeFile(outputPath, result);
          await fs.writeFile(captionPath, caption);
        } catch (error) {
          failed.push(image);
          console.log(`Failed on image:`, image);
        }
      }
    }
  }
}
/*
let counter = 0;
const images = Array.from(
  { length: 30 },
  (_, index) => `./images/anamnesis33 (${index + 1}).jpg`,
);

const zoomLevels = [0];
const repeats = Math.max(5, Math.ceil(150 / images.length));
const className = "woman";
const subject = "ohwx";

await Promise.all(
  images.map((image) => {
    return prepareImage({
      image,
      counter: ++counter,
      sizes,
      zoomLevels,
      repeats,
      className,
      subject,
      outDir: `./outImg/${Date.now()}`,
    });
  }),
);
*/