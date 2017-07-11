import {
    doReject,
    doResolve,
    getThen,
    INTERNAL,
    isArray,
    isFunction,
    isObject,
    safelyResolveThen,
    unwrap,
} from "./utils";

import { QueueItem } from "./queue";
import { AppointState } from "./type";

import makeCo from "./co";

declare const global: any;

/**
 * @constructor
 */
export default class Appoint {
    public static co = makeCo(Appoint);
    /**
     * @param  {any} value
     * @returns Appoint
     */
    public static resolve(value: any): Appoint {
        if (value instanceof Appoint) {
            return value;
        }
        return doResolve(new Appoint(INTERNAL), value);
    }
    /**
     * @param  {any} error
     * @returns Appoint
     */
    public static reject(error: any): Appoint {
        if (error instanceof Appoint) {
            return error;
        }
        return doReject(new Appoint(INTERNAL), error);
    }
    /**
     * @param  {Appoint[]} iterable
     * @returns Appoint
     */
    public static all(iterable: Appoint[]): Appoint {
        const self = this;
        if (!isArray(iterable)) {
            return this.reject(new TypeError("must be an array"));
        }
        const len = iterable.length;
        let called = false;
        if (!len) {
            return this.resolve([]);
        }
        const values = new Array(len);
        let i: number = -1;
        const promise = new Appoint(INTERNAL);
        while (++i < len) {
            allResolver(iterable[i], i);
        }
        return promise;
        function allResolver(value: Appoint, index: number) {
            self.resolve(value).then(resolveFromAll, (error: Error) => {
                if (!called) {
                    called = true;
                    doReject(promise, error);
                }
            });
            function resolveFromAll(outValue: any) {
                values[index] = outValue;
                if (index === len - 1 && !called) {
                    called = true;
                    doResolve(promise, values);
                }
            }
        }
    }
    /**
     * @param  {Appoint[]} iterable
     * @returns Appoint
     */
    public static race(iterable: Appoint[]): Appoint {
        const self = this;
        if (!isArray(iterable)) {
            return this.reject(new TypeError("must be an array"));
        }
        const len = iterable.length;
        let called = false;
        if (!len) {
            return this.resolve([]);
        }
        const values = new Array(len);
        let i: number = -1;
        const promise = new self(INTERNAL);
        while (++i < len) {
            resolver(iterable[i]);
        }
        return promise;
        function resolver(value: Appoint) {
            self.resolve(value).then((response: any) => {
                if (!called) {
                    called = true;
                    doResolve(promise, response);
                }
            }, (error: Error) => {
                if (!called) {
                    called = true;
                    doReject(promise, error);
                }
            });
        }
    }
    /**
     * @returns void
     */
    public static polyfill(): void {
        (function _(glo) {
            if (typeof glo.Promise !== "function") {
                glo.Promise = Appoint;
            }
        })(typeof global === "undefined" ? window : global);
    }
    public handled: boolean;
    public value: any;
    public queue: QueueItem[];
    private state: AppointState;
    /**
     * @param  {(onFulfilled?:(value?:any)=>any,onRejected?:(error?:any)=>any)=>any} resolver
     */
    public constructor(resolver: (
        onFulfilled?: (value?: any) => any,
        onRejected?: (error?: any) => any,
    ) => any) {
        if (!isFunction(resolver)) {
            throw new TypeError("resolver must be a function");
        }
        this.state = AppointState.PENDING;
        this.value = void 0;
        this.queue = [];
        this.handled = true;
        if (resolver !== INTERNAL) {
            safelyResolveThen(this, resolver);
        }
    }
    /**
     * @param  {(value?:any)=>U} onFulfilled?
     * @param  {(error?:any)=>U} onRejected?
     * @returns Appoint
     */
    public then<U>(
        onFulfilled?: (value?: any) => U,
        onRejected?: (error?: any) => U,
    ): Appoint {
        if (!isFunction(onFulfilled) && this.state === AppointState.FULFILLED ||
         !isFunction(onRejected) && this.state === AppointState.REJECTED) {
             return this;
        }
        const promise = new Appoint(INTERNAL);
        if (this.handled) {
            this.handled = false;
        }
        if (this.getState() !== AppointState.PENDING) {
            const resolver = this.getState() === AppointState.FULFILLED ? onFulfilled : onRejected;
            unwrap(promise, resolver, this.value);
        } else {
            this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
        }
        return promise;
    }
    /**
     * @param  {(error?:any)=>U} onRejected
     * @returns Appoint
     */
    public catch<U>(onRejected: (error?: any) => U): Appoint {
        return this.then(null, onRejected);
    }
    public setState(state: AppointState) {
        if (this.state === AppointState.PENDING && this.state !== state) {
            this.state = state;
        }
    }
    public getState(): AppointState {
        return this.state;
    }
}
