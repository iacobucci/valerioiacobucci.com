import React from 'react';

interface FormattedDateProps {
  date: string | Date;
  locale: string;
}

export const FormattedDate = ({ date, locale }: FormattedDateProps) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Basic validation of locale to prevent RangeError
  let validLocale = locale;
  if (!locale || typeof locale !== 'string' || locale.length < 2) {
    validLocale = 'en';
  }

  // YAML dates without time are parsed as midnight UTC.
  // We check if it's exactly midnight UTC to decide whether to show the time.
  const isMidnightUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
  
  try {
    return (
      <time dateTime={d.toISOString()}>
        {new Intl.DateTimeFormat(validLocale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          ...(isMidnightUTC 
            ? { timeZone: 'UTC' } 
            : { hour: '2-digit', minute: '2-digit' }
          )
        }).format(d)}
      </time>
    );
  } catch (e) {
    // Fallback if even with basic validation it fails
    return (
      <time dateTime={d.toISOString()}>
        {d.toLocaleDateString('en-US')}
      </time>
    );
  }
};
