const fs = require("fs");
const path = require("path");

const root = process.cwd();

const manifestPaths = [
  path.join(root, ".next", "server", "pages-manifest.json"),
  path.join(root, ".next", "standalone", ".next", "server", "pages-manifest.json"),
];

const fallbackManifest = {
  "/_app": "pages/_app.js",
  "/_document": "pages/_document.js",
  "/_error": "pages/_error.js",
};

for (const p of manifestPaths) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(fallbackManifest, null, 2));
    console.log(`[gymos] Created fallback pages-manifest.json at: ${p}`);
  }
}
