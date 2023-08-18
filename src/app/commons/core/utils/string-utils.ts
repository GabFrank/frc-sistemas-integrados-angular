
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