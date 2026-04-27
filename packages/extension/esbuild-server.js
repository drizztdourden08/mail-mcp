const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes("--production");

/** @type {import('esbuild').BuildOptions} */
const serverBundleOptions = {
  entryPoints: [path.join(__dirname, "..", "mcp-server", "src", "index.ts")],
  bundle: true,
  outfile: path.join(__dirname, "dist", "mcp-server", "index.js"),
  format: "esm",
  platform: "node",
  target: "node18",
  sourcemap: !production,
  minify: production,
  treeShaking: true,
  // Mark Node built-ins as external
  external: ["node:*"],
  banner: {
    // ESM needs createRequire for any CJS interop
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
};

async function main() {
  await esbuild.build(serverBundleOptions);
  
  // Copy .md assets that the server reads at runtime
  const srcProviders = path.join(__dirname, "..", "mcp-server", "src", "providers");
  const distProviders = path.join(__dirname, "dist", "mcp-server", "providers");
  copyMdFiles(srcProviders, distProviders);

  console.log("[esbuild] mcp-server bundle complete");
}

function copyMdFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyMdFiles(sp, dp);
    } else if (entry.name.endsWith(".md")) {
      fs.copyFileSync(sp, dp);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
