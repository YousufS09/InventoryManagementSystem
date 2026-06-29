function normalizeDate(dateInput) {
  try {
    if (dateInput.includes("/")) {
      const [day, month, year] =
        dateInput.split("/");

      return `${year}-${month.padStart(
        2,
        "0"
      )}-${day.padStart(
        2,
        "0"
      )}`;
    }

    const date =
      new Date(dateInput);

    if (
      isNaN(date.getTime())
    ) {
      return null;
    }

    return date
      .toISOString()
      .split("T")[0];
  } catch {
    return null;
  }
}

module.exports = {
  normalizeDate,
};