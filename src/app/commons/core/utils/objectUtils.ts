import { Type } from '@angular/core';

export function toObjectInput(a: any) {
    console.log(getClassProperties(a))
}

function getClassProperties(instanceOfClass) {
    const proto = Object.getPrototypeOf(instanceOfClass);
    const names = Object.getOwnPropertyNames(proto);
    return names.filter(name => name != 'constructor');
}

