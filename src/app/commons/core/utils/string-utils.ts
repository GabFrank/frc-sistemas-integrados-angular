import { Time } from "@angular/common";

/**
   * Comparar dos strings.
   * @author Gabriel Franco
   * @param str1 - La string original (fija)
   * @param str2 - La string que deseas comparar (variable)
   * @returns True si hay match, false si no
   *
   * @beta
   */
export function comparatorLike(str1: string, str2: string) {
    let length = str1.length;
    let newStr: string = '';
    for (let index = 0; index < length; index++) {
        if (str1[index] != ' ') {
            newStr = newStr + str1[index] + '.*'
        }
    }
    return str2.match(new RegExp(newStr, 'i'));
}

export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function stringToTime(timeString): Date {
    if (timeString) {
        let timeParts = timeString.split(':');
        if (timeParts.length === 2) {
            let hour: number = +timeParts[0];  // The + operator converts the string to a number
            let minute: number = +timeParts[1];
    
            let date = new Date();
            date.setHours(hour, minute);
            return date;
            // Now the date object has the hour and minute set to the values from the form control
        } else {
            console.error('Unexpected time format:', timeString);
        }
    } else {
        console.error('No time value entered');
    }
}