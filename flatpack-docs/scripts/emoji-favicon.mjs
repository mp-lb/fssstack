#!/usr/bin/env node

// scripts-src/lib/args.ts
var getScriptArgs = () => {
  const args = process.argv.slice(2);
  return args[0] === "--" ? args.slice(1) : args;
};
var fail = (message) => {
  console.error(message);
  process.exit(1);
};

// scripts-src/lib/template.ts
var emojiFaviconDataUri = (emoji2) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y="75" font-size="80">${emoji2}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// scripts-src/emoji-favicon.ts
var [emoji] = getScriptArgs();
if (!emoji) {
  fail('Usage: emoji-favicon.mjs "\u{1F680}"');
}
console.log(emojiFaviconDataUri(emoji));
