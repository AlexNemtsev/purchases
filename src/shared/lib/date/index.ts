const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;

export const isValidIsoDate = (value: string): boolean => {
  const match = isoDatePattern.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day <= daysInMonth[month - 1];
};

export const localTodayIso = (now: Date = new Date()): string => {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError('Cannot format an invalid date');
  }

  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatDateRu = (value: string): string => {
  if (!isValidIsoDate(value)) {
    throw new RangeError('Expected a valid ISO date in yyyy-mm-dd format');
  }

  return `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}`;
};
