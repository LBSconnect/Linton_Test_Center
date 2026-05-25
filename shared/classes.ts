export const MAX_CLASS_CAPACITY = 20;
export const CLASS_PRICE_CENTS = 7500; // $75.00

export const CLASS_DEFINITIONS = {
  'life-insurance': {
    title: 'Texas Life Insurance Salesperson Study Session',
    shortTitle: 'Life Insurance',
    startTime: '08:00',
    endTime: '10:00',
    durationHours: 2,
    priceAmount: CLASS_PRICE_CENTS,
  },
  'property-casualty': {
    title: 'Texas Property & Casualty Salesperson Study Session',
    shortTitle: 'Property & Casualty',
    startTime: '10:00',
    endTime: '12:00',
    durationHours: 2,
    priceAmount: CLASS_PRICE_CENTS,
  },
} as const;

export type ClassType = keyof typeof CLASS_DEFINITIONS;

export function isValidClassType(value: string): value is ClassType {
  return value in CLASS_DEFINITIONS;
}

// Returns all Fridays (5) and Saturdays (6) in a given month
export function getClassDatesForMonth(
  year: number,
  month: number, // 1-based
): { date: string; dayOfWeek: 'Friday' | 'Saturday' }[] {
  const dates: { date: string; dayOfWeek: 'Friday' | 'Saturday' }[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const dow = d.getDay();
    if (dow === 5 || dow === 6) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push({ date: dateStr, dayOfWeek: dow === 5 ? 'Friday' : 'Saturday' });
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// Format a "HH:MM" time string to "8:00 AM" style
export function formatClassTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}
