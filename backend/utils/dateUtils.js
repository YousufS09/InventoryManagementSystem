function pad(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));

  // Reject impossible dates such as 31/02/2005 instead of letting them roll over.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Converts user input to a YYYY-MM-DD string, or returns null when it is not a valid date.
 * Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY and natural text such as "9 March 2005".
 * Never goes through toISOString(), so the date cannot shift because of the server time zone.
 */
function normalizeDate(input) {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return toIsoDate(match[1], match[2], match[3]);
  }

  match = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (match) {
    return toIsoDate(match[3], match[2], match[1]);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

function isPastOrToday(isoDate) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return isoDate <= todayIso;
}

module.exports = {
  normalizeDate,
  isPastOrToday,
};
