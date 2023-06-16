import { formatDate } from "@angular/common";

export function dateToString(date: Date, format?:string): string {
    if (date != null) { return formatDate(date, format || 'yyyy-MM-dd HH:mm', 'en-Us'); }
}

export function getFirstDayOfNextMonth() {
    const date = new Date();

    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function getLastDayOfNextMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export const mask = {
    guide: true,
    showMask : true,
    mask: [/\d/, /\d/, '/', /\d/, /\d/, '/',/\d/, /\d/,/\d/, /\d/]
};

export function combineDateTime(date: Date, time: string): Date {
    const timeParts = time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
  
    const combinedDate = new Date(date);
    combinedDate.setHours(hours);
    combinedDate.setMinutes(minutes);
  
    return combinedDate;
  }