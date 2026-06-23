import { randomInt, randomUUID } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BUSINESS_ID_SIZE = 21;
const SHORT_ID_SIZE = 12;

function customAlphabet(size: number) {
  return Array.from(
    { length: size },
    () => ALPHABET[randomInt(0, ALPHABET.length)],
  ).join('');
}

export function generateBusinessId() {
  return customAlphabet(BUSINESS_ID_SIZE);
}

export function generateShortId() {
  return customAlphabet(SHORT_ID_SIZE);
}

export function nanoid() {
  return randomUUID().replaceAll('-', '');
}
