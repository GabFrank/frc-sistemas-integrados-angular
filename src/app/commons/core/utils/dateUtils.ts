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