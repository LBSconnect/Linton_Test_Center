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
    capacity: MAX_CLASS_CAPACITY,
  },
  'property-casualty': {
    title: 'Texas Property & Casualty Salesperson Study Session',
    shortTitle: 'Property & Casualty',
    startTime: '10:00',
    endTime: '12:00',
    durationHours: 2,
    priceAmount: CLASS_PRICE_CENTS,
    capacity: MAX_CLASS_CAPACITY,
  },
  'tutoring': {
    title: 'Tutoring Session',
    shortTitle: 'Tutoring',
    startTime: '16:30',
    endTime: '17:30',
    durationHours: 1,
    priceAmount: 4000, // $40
    capacity: MAX_CLASS_CAPACITY,
  },
} as const;

export type ClassType = keyof typeof CLASS_DEFINITIONS;

// Days of week each class type is scheduled (0=Sun … 6=Sat)
export const CLASS_SCHEDULED_DAYS: Record<ClassType, number[]> = {
  'life-insurance':    [5, 6],       // Fri, Sat
  'property-casualty': [5, 6],       // Fri, Sat
  'tutoring':          [1, 2, 3, 4], // Mon–Thu
};

export function isValidClassType(value: string): value is ClassType {
  return value in CLASS_DEFINITIONS;
}

// Returns all dates in a month that have at least one class scheduled
export function getClassDatesForMonth(
  year: number,
  month: number, // 1-based
): { date: string; dayOfWeek: string }[] {
  const allDays = new Set(Object.values(CLASS_SCHEDULED_DAYS).flat());
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dates: { date: string; dayOfWeek: string }[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const dow = d.getDay();
    if (allDays.has(dow)) {
      dates.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        dayOfWeek: DAY_NAMES[dow],
      });
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
