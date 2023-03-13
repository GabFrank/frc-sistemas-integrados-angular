export function enumToArray(enumme): string[] {
    return Object.keys(enumme)
        .filter(StringIsNumber)
        .map(key => enumme[key]);
}

const StringIsNumber = value => isNaN(Number(value)) === false;
