
export function orderByIdAsc<T>(arr: T[]): T[]{
    return arr.sort((a,b) => {  
        if(a['id'] > b['id']){
            return 1;
        } else {
            return -1;
        }
    })
}

export function orderByIdDesc<T>(arr: T[]): T[]{
    return arr.sort((a,b) => {
        if(a['id'] > b['id']){
            return -1;
        } else {
            return 1;
        }
    })
}

export function replaceObject<T>(arr: T[], object:T): T[]{
    let index = arr.findIndex(e => e['id'] == object['id']);
    if(index!=null){
        arr[index] = object;
    }
    return arr;
}