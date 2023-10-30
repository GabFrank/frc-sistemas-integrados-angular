import { formatDate } from "@angular/common";

export function dateToString(date: Date, format?: string): string {
  if (date != null) {
    return formatDate(date, format || "yyyy-MM-dd HH:mm", "en-Us");
  }
}

export function getFirstDayOfNextMonth() {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function getLastDayOfNextMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getFirstDayOfCurrentWeek() {
  const currentDate = new Date();
  const currentDayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, and so on

  // Calculate the number of days to subtract to get to the first day of the week (assuming Monday as the first day)
  const daysToSubtract = currentDayOfWeek - 1; // Adjust as needed

  // Set the date to the first day of the week
  currentDate.setDate(currentDate.getDate() - daysToSubtract);

  return currentDate;
}

export function getLastDayOfCurrentWeek() {
  const currentDate = new Date();
  const currentDayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, and so on

  // Calculate the number of days to add to get to the last day of the week (assuming Sunday is the last day)
  const daysToAdd = 6 - currentDayOfWeek; // Adjust as needed

  // Set the date to the last day of the week
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  return currentDate;
}

export function getFirstDayOfMonths(n: number) {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + n);
  currentDate.setDate(1); // Set to the first day of the month
  return currentDate;
}

export function getLastDayOfMonths(n: number) {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + n + 1); // Add n months and advance to the next month
  currentDate.setDate(0); // Set to the last day of the previous month
  return currentDate;
}

export const mask = {
  guide: true,
  showMask: true,
  mask: [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/],
};

export function combineDateTime(date: Date, time: string): Date {
  const timeParts = time.split(":");
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  const combinedDate = new Date(date);
  combinedDate.setHours(hours);
  combinedDate.setMinutes(minutes);

  return combinedDate;
}
