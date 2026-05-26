import { cp, mkdir, rm } from "node:fs/promises";

const files = ["index.html", "styles.css", "app.js", "assets"];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of files) {
  await cp(file, `dist/${file}`, { recursive: true, force: true });
}

console.log("Deploy files ready in dist/");
