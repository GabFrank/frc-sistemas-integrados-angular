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

export interface RangoFechaPeriodo {
  inicio: string;
  fin: string;
}

/**
 * Formato yyyy-MM-dd para rangos de gráficos (alineado con backend DateUtils PATTERN).
 */
export function formatearFechaGrafico(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Fecha de calendario local (evita desfase por zona horaria del datepicker). */
export function fechaCalendarioLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Rango entre dos fechas del datepicker (inclusive, fin 23:59:59).
 * Formato alineado con backend: yyyy-MM-dd HH:mm:ss
 */
export function generarRangoFechaGraficoDesdeRango(
  inicio: Date,
  fin: Date
): RangoFechaPeriodo | null {
  const dInicio = fechaCalendarioLocal(inicio);
  const dFin = fechaCalendarioLocal(fin);
  if (dFin < dInicio) {
    return null;
  }
  return {
    inicio: `${formatearFechaGrafico(dInicio)} 00:00:00`,
    fin: `${formatearFechaGrafico(dFin)} 23:59:59`,
  };
}

/**
 * Genera inicio/fin en formato yyyy-MM-dd HH:mm para queries GraphQL de estadísticas.
 * Día: [00:00 del día, 00:00 del día siguiente). Mes/año: fin inclusive 23:59.
 */
export function generarRangoFechaGrafico(
  anho: number,
  mes: number | null,
  fechaDia: Date | null = null
): RangoFechaPeriodo {
  if (fechaDia) {
    const inicio = `${formatearFechaGrafico(fechaDia)} 00:00`;
    const diaSiguiente = new Date(fechaDia);
    diaSiguiente.setDate(fechaDia.getDate() + 1);
    return {
      inicio,
      fin: `${formatearFechaGrafico(diaSiguiente)} 00:00`,
    };
  }

  if (mes) {
    const mesStr = String(mes).padStart(2, "0");
    const ultimoDiaMes = new Date(anho, mes, 0);
    const finMes = String(ultimoDiaMes.getMonth() + 1).padStart(2, "0");
    const finDia = String(ultimoDiaMes.getDate()).padStart(2, "0");
    return {
      inicio: `${anho}-${mesStr}-01 00:00`,
      fin: `${ultimoDiaMes.getFullYear()}-${finMes}-${finDia} 23:59`,
    };
  }

  return {
    inicio: `${anho}-01-01 00:00`,
    fin: `${anho}-12-31 23:59`,
  };
}

export function listarAnhosGrafico(cantidad = 5): number[] {
  const anhoActual = new Date().getFullYear();
  return Array.from({ length: cantidad }, (_, i) => anhoActual - i);
}

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


export function formatearFecha(event: any): any {
  let input = event.target.value.replace(/\D/g, ""); // Remove any non-digit characters

  if (input.length > 2 && input.length <= 4) {
    if(+input.slice(0,2) > 31){
      return `${input.slice(0, 2)}/12`
    }
    // Add slash after day
    input = `${input.slice(0, 2)}/${input.slice(2)}`;
  } else if (input.length > 4) {
    // Add slashes after day and month
    if(+input.slice(0,2) > 31){
      return `${input.slice(0, 2)}/12`
    }
    
    if(+input.slice(2,4) > 12){
      return `${input.slice(0, 2)}/12`
    }
    input = `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4, 6)}`;
  }

  return input; // Update the form control without emitting an event
}
