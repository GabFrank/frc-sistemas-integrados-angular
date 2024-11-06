import { formatDate } from "@angular/common";

export function dateToString(date: Date, format?: string): string {
  if (date != null) {
    return formatDate(date, format || "yyyy-MM-dd HH:mm", "en-Us");
  } else {
    return null;
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

export function getFirstDayOfNMonth(month: number) {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth() + month, 1);
}

export function getLastDayOfNMonth(month: number) {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + month, 0);
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

export function validarFecha(dateString: string): boolean {
  // Regex for the first pattern (dd/mm/yyyy)
  const longDatePattern = /^\d{2}\/\d{2}\/\d{4}$/;
  // Regex for the second pattern (dd/mm/yy)
  const shortDatePattern = /^\d{2}\/\d{2}\/\d{2}$/;  

  // Check if it matches the long date pattern (dd/mm/yyyy)
  if (longDatePattern.test(dateString)) {
    
    const [day, month, year] = dateString.split('/').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    
    if (isValidDate(parsedDate, day, month, year)) {
      return true;
    } else {
      return false;
    }
  }
  
  // Check if it matches the short date pattern (dd/mm/yy)
  else if (shortDatePattern.test(dateString)) {
    const [day, month, shortYear] = dateString.split('/').map(Number);
    // Convert short year to full year (assume 21st century for '24', i.e., 2024)
    const fullYear = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
    const parsedDate = new Date(fullYear, month - 1, day);

    if (isValidDate(parsedDate, day, month, fullYear)) {
      return true;
    } else {
      return false;
    }
  }

  // If no pattern matches, throw an error
  else {
    return false;
  }
}

// Helper function to check if the parsed date is valid by verifying the year, month, and day
export function isValidDate(date: Date, day: number, month: number, year: number): boolean {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseShortDate(dateString: string | null): Date | null {
  // Return null if the string is null
  if (!dateString) {
    return null;
  }

  // Regex for validating the date format dd/mm/yy
  const shortDatePattern = /^\d{2}\/\d{2}\/\d{2}$/;

  // Check if the dateString matches the pattern
  if (shortDatePattern.test(dateString)) {
    const [day, month, shortYear] = dateString.split('/').map(Number);
    
    // Convert the short year to a full year (assuming 21st century for values < 50)
    const fullYear = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;

    // Create and return the Date object
    const parsedDate = new Date(fullYear, month - 1, day);

    // Validate that the created date is valid
    if (isValidDate(parsedDate, day, month, fullYear)) {
      return parsedDate;
    } else {
      throw new Error('Invalid date value');
    }
  }

  // If format does not match, throw an error
  throw new Error('Invalid date format');
}

