import React from 'react';

interface FormattedDateProps {
  date: string | Date;
  locale: string;
}

export const FormattedDate = ({ date, locale }: FormattedDateProps) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // YAML dates without time are parsed as midnight UTC.
  // We check if it's exactly midnight UTC to decide whether to show the time.
  const isMidnightUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
  
  return (
    <time dateTime={d.toISOString()}>
      {new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        // If it's midnight UTC, it's likely a date-only field, so we hide the time and stay in UTC
        // to avoid timezone shifts that could change the day.
        // Otherwise, we show the time in the user's local timezone.
        ...(isMidnightUTC 
          ? { timeZone: 'UTC' } 
          : { hour: '2-digit', minute: '2-digit' }
        )
      }).format(d)}
    </time>
  );
};
