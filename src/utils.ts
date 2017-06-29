export function immediate(func: Function) {
    if (!isFunction(func)) {
        return setTimeout(() => {}, 0)
    }
    const args: any[] = Array.prototype.slice.call(arguments, 1)
    return setTimeout(() => {
        func.apply(void 0, args)
    }, 0)
}
export function INTERNAL(): void {}
export function isFunction(func:any):boolean {
    return typeof func === 'function';
}
export function isObject(obj:any):boolean {
    return typeof obj === 'object';
}
export function isArray(arr:any):boolean {
    return Object.prototype.toString.call(arr) === '[object Array]';
}
export function getThen(obj: any): Function {
    var then = obj && obj.then
    if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
        const appyThen = isFunction(then.bind) ?
            then.bind(obj) :
            function(onFulfilled?: Function, onRejected?: Function) {
                then.call(obj, onFulfilled, onRejected)
            }
        return appyThen
    }
    return void 0
}