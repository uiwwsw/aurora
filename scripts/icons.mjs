import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";
const svg = await readFile(new URL("../build/icon.svg", import.meta.url));
await writeFile(
  new URL("../build/icon.png", import.meta.url),
  new Resvg(svg).render().asPng(),
);
