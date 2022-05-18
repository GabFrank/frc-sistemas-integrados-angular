import { formatDate } from "@angular/common";

export function dateToString(date: Date): string {
    if (date != null) { return formatDate(date, 'yyyy-MM-dd HH:mm', 'en-Us'); }
}