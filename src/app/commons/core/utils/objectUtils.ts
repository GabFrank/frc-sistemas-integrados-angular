import { Type } from '@angular/core';

export function toObjectInput(a: any) {
    console.log(getClassProperties(a))
}

function getClassProperties(instanceOfClass) {
    const proto = Object.getPrototypeOf(instanceOfClass);
    const names = Object.getOwnPropertyNames(proto);
    return names.filter(name => name != 'constructor');
}

export function deserializeEntity<T>(cls: new () => T, obj: any): T {
    return Object.assign(new cls(), obj);
}


