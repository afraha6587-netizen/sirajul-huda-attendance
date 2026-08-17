export const getHijriDateString = (dateInput?: string | Date): string => {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '';

    // Convert date using Intl Islamic Umm al-Qura calendar
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-uma', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(d);
    let day = '';
    let month = '';
    let year = '';

    parts.forEach((p) => {
      if (p.type === 'day') day = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'year') year = p.value;
    });

    return `${day} ${month} ${year} AH`;
  } catch (e) {
    return '';
  }
};
