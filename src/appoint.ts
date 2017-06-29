import { 
    immediate,
    INTERNAL,
    isFunction,
    isObject,
    isArray,
    getThen
} from './utils'

/**
 * @constructor
 */
export default class Appoint {
    private state: AppointState
    handled: string
    value: any
    queue: QueueItem[]
    constructor(resolver: Function) {
        if (!isFunction(resolver)) {
            throw new TypeError('resolver must be a function')
        }
        this.state = AppointState.PENDING
        this.value = void 0
        this.queue = []
        this.handled = UNHANDLED
        if (resolver !== INTERNAL) {
            safelyResolveThen(this, resolver)
        }
    }
    static resolve(value) {
        if (value instanceof Appoint) {
            return value
        }
        return doResolve(new Appoint(INTERNAL), value)
    }
    static reject(error) {
        if (error instanceof Appoint) {
            return error
        }
        return doReject(new Appoint(INTERNAL), error)
    }
    static all(iterable: Appoint[]) {
        const self = this
        if (!isArray(iterable)) {
            return this.reject(new TypeError('must be an array'))
        }
        const len = iterable.length
        let called = false
        if (!len) {
            return this.resolve([])
        }
        const values = new Array(len)
        let i: number = -1
        const promise = new Appoint(INTERNAL)
        while (++i < len) {
            allResolver(iterable[i], i)
        }
        return promise
        function allResolver(value: Appoint, i: number) {
            self.resolve(value).then(resolveFromAll, function(error: Error) {
                if (!called) {
                    called = true
                    doReject(promise, error)
                }
            })
            function resolveFromAll (outValue: any) {
                values[i] = outValue
                if (i === len - 1 && !called) {
                    called = true
                    doResolve(promise, values)
                }
            }
        }
    }
    static race(iterable) {
        const self = this
        if (!isArray(iterable)) {
            return this.reject(new TypeError('must be an array'))
        }
        const len = iterable.length
        let called = false
        if (!len) {
            return this.resolve([])
        }
        const values = new Array(len)
        let i: number = -1
        const promise = new self(INTERNAL)
        while (++i < len) {
            resolver(iterable[i])
        }
        return promise
        function resolver(value: Appoint) {
            self.resolve(value).then(function(response: any) {
                if (!called) {
                    called = true
                    doResolve(promise, response)
                }
            }, function(error: Error) {
                if (!called) {
                    called = true
                    doReject(promise, error)
                }
            })
        }
    }
    then(onFulfilled?: Function, onRejected?: Function) {
        if (!isFunction(onFulfilled) && this.pState === AppointState.FULFILLED ||
         !isFunction(onRejected) && this.pState === AppointState.REJECTED) {
             return this
        }
        const promise = new Appoint(INTERNAL)
        if (this.handled === UNHANDLED) {
            this.handled = null;
        }
        if (this.pState !== AppointState.PENDING) {
            const resolver: Function = this.pState === AppointState.FULFILLED ? onFulfilled : onRejected
            unwrap(promise, resolver, this.value)
        } else {
            this.queue.push(new QueueItem(promise, onFulfilled, onRejected))
        }
        return promise
    }
    catch(onRejected: Function) {
        return this.then(null, onRejected)
    }
    set pState(state: AppointState) {
        if (this.state === AppointState.PENDING && this.state !== state) {
            this.state = state
        }
    }
    get pState():AppointState {
        return this.state
    }
}

class QueueItem {
    promise: Appoint
    callFulfilled: Function
    callRejected: Function
    constructor(promise: Appoint, onFulfilled?: Function, onRejected?: Function) {
        this.promise = promise
        if (isFunction(onFulfilled)) {
            this.callFulfilled = function(value: any) {
                unwrap(this.promise, onFulfilled, value)
            }
        } else {
            this.callFulfilled = function(value: any) {
                doResolve(this.promise, value)
            }
        }
        if (isFunction(onRejected)) {
            this.callRejected = function (error: Error) {
                unwrap(this.promise, onRejected, error)
            }
        } else {
            this.callRejected = function (error: Error) {
                doReject(this.promise, error)
            }
        }
    }
}

enum AppointState {
    PENDING,
    FULFILLED,
    REJECTED
}
const UNHANDLED = 'UNHANDLED'

function unwrap(promise: Appoint, func: Function, value: any):void {
    immediate(function() {
        let returnValue
        try {
            returnValue = func(value)
        } catch (error) {
            return doReject(promise, error)
        }
        if (returnValue === promise) {
            doReject(promise, new TypeError('Cannot resolve promise with itself'))
        } else {
            doResolve(promise, returnValue);
        }
    })
}
function doResolve(self: Appoint, value: any) {
    try {
        var then = getThen(value);
        if (then) {
            safelyResolveThen(self, then)
        } else {
            self.pState = AppointState.FULFILLED
            self.value = value
            self.queue.forEach(function(queueItem) {
                queueItem.callFulfilled(value)
            })
        }
        return self
    } catch (error) {
        return doReject(self, error)
    }
}
function safelyResolveThen(self: Appoint, then: Function) {
    let called: Boolean = false
    try {
        then(function (value: any) {
            if (called) {
                return
            }
            called = true
            doResolve(self, value)
        }, function(error: Error) {
            if (called) {
                return
            }
            called = true
            doReject(self, error)
        })
    } catch (error) {
        if (called) {
            return
        }
        called = true
        doReject(self, error)
    }
}

function doReject(self: Appoint, error: Error) {
    self.pState = AppointState.REJECTED
    self.value = error
    if (self.handled === UNHANDLED) {
        immediate(function () {
            if (self.handled === UNHANDLED) {
                console.error(error)
            }
        })
    }
    self.queue.forEach(function (queueItem) {
        queueItem.callRejected(error)
    })
    // if (!called) throw error
    return self
}