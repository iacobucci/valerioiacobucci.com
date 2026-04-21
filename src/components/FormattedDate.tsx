import React from 'react';

interface FormattedDateProps {
  date: string | Date;
  locale: string;
}

export const FormattedDate = ({ date, locale }: FormattedDateProps) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return (
    <time dateTime={d.toISOString()}>
      {new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d)}
    </time>
  );
};
