import { formatDate } from "@angular/common";

export function dateToString(date: Date): string {
    return formatDate(date,'yyyy-MM-dd HH:mm', 'en-Us');
}