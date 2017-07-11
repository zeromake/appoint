import Appoint from "./appoint";
import { AppointState } from "./type";

import { asap } from "./asap";

declare const process: any;

export function INTERNAL(): void { return void 0; }
export function isFunction(func: any): boolean {
    return typeof func === "function";
}
export function isObject(obj: any): boolean {
    return typeof obj === "object";
}
export function isArray(arr: any): boolean {
    return Object.prototype.toString.call(arr) === "[object Array]";
}
export function getThen(obj: any): (args: any) => any {
    const then = obj && obj.then;
    if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
        const appyThen = isFunction(then.bind) ?
            then.bind(obj) :
            (onFulfilled?: (value) => any, onRejected?: (error: Error) => any) => {
                return then.call(obj, onFulfilled, onRejected);
            };
        return appyThen;
    }
    return void 0;
}

function schedule(callback) {
    process.nextTick(() => {
        callback();
    });
}

export function unwrap(promise: Appoint, func: (...args) => void, value: any): void {
    asap(() => {
        let returnValue;
        try {
            returnValue = func(value);
        } catch (error) {
            return doReject(promise, error);
        }
        if (returnValue === promise) {
            doReject(promise, new TypeError("Cannot resolve promise with itself"));
        } else {
            doResolve(promise, returnValue);
        }
    });
}
export function doResolve(self: Appoint, value: any) {
    try {
        const then = getThen(value);
        if (then) {
            safelyResolveThen(self, then);
        } else {
            self.setState(AppointState.FULFILLED);
            self.value = value;
            self.queue.forEach((queueItem) => {
                queueItem.callFulfilled(value);
            });
        }
        return self;
    } catch (error) {
        return doReject(self, error);
    }
}
export function safelyResolveThen(self: Appoint, then: (...args) => void) {
    let called: boolean = false;
    try {
        then(function resolvePromise(value: any) {
            if (called) {
                return;
            }
            called = true;
            doResolve(self, value);
        }, function rejectPromise(error: Error) {
            if (called) {
                return;
            }
            called = true;
            doReject(self, error);
        });
    } catch (error) {
        if (called) {
            return;
        }
        called = true;
        doReject(self, error);
    }
}

export function doReject(self: Appoint, error: Error) {
    self.setState(AppointState.REJECTED);
    self.value = error;
    console.log("no async", self.handled);
    if (self.handled) {
        asap(() => {
            console.log("async", self.handled);
            if (self.handled) {
                if (typeof process !== "undefined") {
                    process.emit("unhandledRejection", error, self);
                } else {
                    console.error(error);
                }
            }
        });
    }
    self.queue.forEach((queueItem) => {
        queueItem.callRejected(error);
    });
    return self;
}
