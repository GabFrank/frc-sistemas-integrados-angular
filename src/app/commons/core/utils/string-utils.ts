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