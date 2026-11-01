import { MAX_AMOUNT_KOPECKS, MAX_PERMILLE } from '../../config';

const moneyInputPattern = /^(\d+|\d{1,3}(?:[\s\u00a0\u202f]\d{3})+)(?:[.,](\d{1,2}))?$/u;
const permilleInputPattern = /^(\d+)(?:[.,](\d))?$/u;
const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
  useGrouping: true,
});
const percentFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export const roundDiv = (numerator: bigint, denominator: bigint): bigint => {
  if (denominator <= 0n) {
    throw new RangeError('The denominator must be greater than zero');
  }

  const isNegative = numerator < 0n;
  const absoluteNumerator = isNegative ? -numerator : numerator;
  const rounded = (2n * absoluteNumerator + denominator) / (2n * denominator);

  return isNegative ? -rounded : rounded;
};

export const parseMoney = (value: string): number | null => {
  const match = moneyInputPattern.exec(value.trim());

  if (!match) {
    return null;
  }

  const whole = match[1].replace(/[\s\u00a0\u202f]/gu, '');
  const fractional = (match[2] ?? '').padEnd(2, '0');
  const kopecks = BigInt(whole) * 100n + BigInt(fractional || '0');

  if (kopecks > BigInt(MAX_AMOUNT_KOPECKS)) {
    return null;
  }

  return Number(kopecks);
};

export const parsePermille = (value: string): number | null => {
  const match = permilleInputPattern.exec(value.trim());

  if (!match) {
    return null;
  }

  const whole = BigInt(match[1]);
  const fractional = BigInt(match[2] ?? '0');
  const permille = whole * 10n + fractional;

  if (permille > BigInt(MAX_PERMILLE)) {
    return null;
  }

  return Number(permille);
};

export const formatMoney = (kopecks: number): string => {
  if (!Number.isSafeInteger(kopecks)) {
    throw new RangeError('Kopecks must be a safe integer');
  }

  const amount = BigInt(kopecks);
  const isNegative = amount < 0n;
  const absoluteAmount = isNegative ? -amount : amount;
  const rubles = absoluteAmount / 100n;
  const remainder = String(absoluteAmount % 100n).padStart(2, '0');
  const sign = isNegative ? '-' : '';

  return `${sign}${numberFormatter.format(rubles)},${remainder} ₽`;
};

export const formatPermille = (permille: number): string => {
  if (!Number.isSafeInteger(permille)) {
    throw new RangeError('Permille must be a safe integer');
  }

  return `${percentFormatter.format(permille / 10)} %`;
};
