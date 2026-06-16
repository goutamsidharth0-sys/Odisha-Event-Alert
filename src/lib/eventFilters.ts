// Shared Prisma filter for "upcoming or currently running" events, so past
// events never leak into featured / homepage / landing sections. A multi-day
// event counts as upcoming until its end date passes; single-day events until
// their start date passes (with the day itself still counting).

export function upcomingWhere(now: Date = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return {
    OR: [
      { endDate: { gte: start } },
      { endDate: null, startDate: { gte: start } },
    ],
  };
}
