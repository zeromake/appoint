import { doReject, doResolve, isFunction, unwrap} from "./utils";

import Appoint from "./appoint";

export class QueueItem {
    public promise: Appoint;
    public callFulfilled: (...args: any[]) => void;
    public callRejected: (...args: any[]) => void;
    constructor(promise: Appoint, onFulfilled?: (...args: any[]) => void, onRejected?: (...args: any[]) => void) {
        this.promise = promise;
        if (isFunction(onFulfilled)) {
            this.callFulfilled = function(value: any) {
                unwrap(this.promise, onFulfilled, value);
            };
        } else {
            this.callFulfilled = function(value: any) {
                doResolve(this.promise, value);
            };
        }
        if (isFunction(onRejected)) {
            this.callRejected = function(error: Error) {
                unwrap(this.promise, onRejected, error);
            };
        } else {
            this.callRejected = function(error: Error) {
                doReject(this.promise, error);
            };
        }
    }
}
