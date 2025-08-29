import validator from 'validator';

export function isValidHttpUrl(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}
