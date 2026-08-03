import { randomInt } from "node:crypto";

// Reference codes travel by WhatsApp, get read aloud on the phone, and get
// written on a job card in the workshop. The alphabet excludes the characters
// that get misread there: 0/O, 1/I/L, 5/S, 8/B, 2/Z.
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";
const LENGTH = 4;

/** e.g. FP-8H3K */
export function generateRefCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `FP-${code}`;
}

export function isRefCode(value: string): boolean {
  return new RegExp(`^FP-[${ALPHABET}]{${LENGTH}}$`).test(value);
}
