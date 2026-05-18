import { fail, getScriptArgs } from "./lib/args";
import { emojiFaviconDataUri } from "./lib/template";

const [emoji] = getScriptArgs();

if (!emoji) {
  fail('Usage: emoji-favicon.mjs "🚀"');
}

console.log(emojiFaviconDataUri(emoji));
