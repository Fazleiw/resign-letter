import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LETTER = "Nobody reads the Retry-After. Everybody reads the 429. I've stopped writing the Retry-After.";

const MAX_CHARS = 140;

function fail(message: string): never {
  console.error(`entry rejected: ${message}`);
  process.exit(1);
}

if (LETTER.trim() === "") fail("text is empty or only white space");

// The scorer counts characters, so count code points: String#length counts
// UTF-16 units and would double-count anything outside the BMP (e.g. emoji).
const chars = [...LETTER].length;
if (chars < 1 || chars > MAX_CHARS) fail(`${chars} characters, must be 1 to ${MAX_CHARS}`);

if (/[\r\n]/.test(LETTER)) fail("text must be a single line (no CR or LF)");

// Straight and typographic double/single quotes, plus guillemets.
const QUOTES = /^["'“”‘’«»]|["'“”‘’«»]$/;
if (QUOTES.test(LETTER)) fail("text must not begin or end with a quotation mark");

const dir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const path = join(dir, "entry.txt");
mkdirSync(dir, { recursive: true });
const expected = LETTER + "\n";
writeFileSync(path, expected, "utf8");

// Check the byte count explicitly: TextDecoder silently drops a leading BOM,
// so a file with extra bytes could still decode to an equal string.
const bytes = readFileSync(path);
const expectedBytes = Buffer.byteLength(expected, "utf8");
if (bytes.length !== expectedBytes) fail(`${path} is ${bytes.length} bytes, expected ${expectedBytes}`);

// Decode strictly: a lone surrogate or other encoding slip would otherwise
// be silently replaced with U+FFFD on write.
const readback = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
if (readback !== expected) fail(`readback of ${path} does not match LETTER`);

console.log(`${chars} chars, ${bytes.length} bytes -> ${path}`);
