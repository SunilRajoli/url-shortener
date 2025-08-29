import { customAlphabet } from 'nanoid';

const DEFAULT_LENGTH = Number(process.env.CODE_LENGTH ?? 7);
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const generateCode = (length = DEFAULT_LENGTH) => {
  const nano = customAlphabet(ALPHABET, length);
  return nano();
};
