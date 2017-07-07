(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Appoint = factory());
}(this, (function () { 'use strict';

var AppointState;
(function (AppointState) {
    AppointState[AppointState["PENDING"] = 0] = "PENDING";
    AppointState[AppointState["FULFILLED"] = 1] = "FULFILLED";
    AppointState[AppointState["REJECTED"] = 2] = "REJECTED";
})(AppointState || (AppointState = {}));

// copy to https://github.com/petkaantonov/bluebird/blob/master/src/schedule.js
var schedule;
var noAsyncScheduler = function noAsyncScheduler() {
    throw new Error("NO_ASYNC_SCHEDULER");
};
var isNode = typeof process !== "undefined" &&
    Object.prototype.toString.call(process).toLowerCase() === "[object process]";
var util = {
    isNode,
    isRecentNode: isNode && (function isRecentNode() {
        var version = process.versions.node.split(".").map(Number);
        return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
    })(),
    getNativePromise: function () {
        if (typeof Promise === "function") {
            try {
                var promise = new Promise(function _() { return void 0; });
                if ({}.toString.call(promise) === "[object Promise]") {
                    return Promise;
                }
            }
            catch (e) {
                return void 0;
            }
        }
    }
};
var NativePromise = util.getNativePromise();
// 如果是node环境且MutationObserver不存在使用setImmediate或process.nextTick
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate_1 = global.setImmediate;
    var ProcessNextTick_1 = process.nextTick;
    schedule = util.isRecentNode
        ? function _() {
            GlobalSetImmediate_1(makeFunction(this, arguments));
        }
        : function _() {
            ProcessNextTick_1(makeFunction(this, arguments));
        };
}
else if (typeof NativePromise === "function" &&
    typeof NativePromise.resolve === "function") {
    var nativePromise_1 = NativePromise.resolve();
    schedule = function _() {
        nativePromise_1.then(makeFunction(this, arguments));
    };
}
else if ((typeof MutationObserver !== "undefined") &&
    !(typeof window !== "undefined" &&
        window.navigator &&
        (window.navigator.standalone || window.cordova))) {
    schedule = (function _() {
        var div = document.createElement("div");
        var opts = { attributes: true };
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function Observer() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);
        var scheduleToggle = function scheduleToggle() {
            if (toggleScheduled) {
                return;
            }
            toggleScheduled = true;
            div2.classList.toggle("foo");
        };
        return function schedule() {
            var newFun = makeFunction(this, arguments);
            var o = new MutationObserver(function _() {
                o.disconnect();
                newFun();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
}
else if (typeof setImmediate !== "undefined") {
    schedule = function schedule() {
        setImmediate(makeFunction(this, arguments));
    };
}
else if (typeof setTimeout !== "undefined") {
    schedule = function schedule() {
        setTimeout(makeFunction(this, arguments), 0);
    };
}
else {
    schedule = noAsyncScheduler;
}
function makeFunction(ctx, args) {
    var len = args.length;
    if (len === 0 || typeof args[0] !== "function") {
        throw Error("not function");
    }
    var fun = args[0];
    var callback = len > 1 ? args[1] : null;
    var funArgs = Array.prototype.slice.call(args, 2);
    return function () {
        var res = fun.apply(ctx, funArgs);
        if (typeof callback === "function") {
            callback(res);
        }
    };
}
var schedule$1 = schedule;

function INTERNAL() { return void 0; }
function isFunction(func) {
    return typeof func === "function";
}
function isObject(obj) {
    return typeof obj === "object";
}
function isArray(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
}
function getThen(obj) {
    var then = obj && obj.then;
    if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
        var appyThen = isFunction(then.bind) ?
            then.bind(obj) :
            function (onFulfilled, onRejected) {
                return then.call(obj, onFulfilled, onRejected);
            };
        return appyThen;
    }
    return void 0;
}
function unwrap(promise, func, value) {
    schedule$1(function () {
        var returnValue;
        try {
            returnValue = func(value);
        }
        catch (error) {
            return doReject(promise, error);
        }
        if (returnValue === promise) {
            doReject(promise, new TypeError("Cannot resolve promise with itself"));
        }
        else {
            doResolve(promise, returnValue);
        }
    });
}
function doResolve(self, value) {
    try {
        var then = getThen(value);
        if (then) {
            safelyResolveThen(self, then);
        }
        else {
            self.setState(AppointState.FULFILLED);
            self.value = value;
            self.queue.forEach(function (queueItem) {
                queueItem.callFulfilled(value);
            });
        }
        return self;
    }
    catch (error) {
        return doReject(self, error);
    }
}
function safelyResolveThen(self, then) {
    var called = false;
    try {
        then(function (value) {
            if (called) {
                return;
            }
            called = true;
            doResolve(self, value);
        }, function (error) {
            if (called) {
                return;
            }
            called = true;
            doReject(self, error);
        });
    }
    catch (error) {
        if (called) {
            return;
        }
        called = true;
        doReject(self, error);
    }
}
function doReject(self, error) {
    self.setState(AppointState.REJECTED);
    self.value = error;
    if (self.handled) {
        schedule$1(function () {
            if (self.handled) {
                if (typeof process !== "undefined") {
                    process.emit("unhandledRejection", error, self);
                }
                else {
                    console.error(error);
                }
            }
        });
    }
    self.queue.forEach(function (queueItem) {
        queueItem.callRejected(error);
    });
    return self;
}

var QueueItem = (function () {
    function QueueItem(promise, onFulfilled, onRejected) {
        this.promise = promise;
        if (isFunction(onFulfilled)) {
            this.callFulfilled = function (value) {
                unwrap(this.promise, onFulfilled, value);
            };
        }
        else {
            this.callFulfilled = function (value) {
                doResolve(this.promise, value);
            };
        }
        if (isFunction(onRejected)) {
            this.callRejected = function (error) {
                unwrap(this.promise, onRejected, error);
            };
        }
        else {
            this.callRejected = function (error) {
                doReject(this.promise, error);
            };
        }
    }
    return QueueItem;
}());

function makeCo(pro) {
    return (function (Promise) {
        var slice = Array.prototype.slice;
        function co(gen) {
            var ctx = this;
            var args = slice.call(arguments, 1);
            return new Promise(function _(resolve, reject) {
                // 把传入的方法执行一下并存下返回值
                if (typeof gen === "function") {
                    gen = gen.apply(ctx, args);
                }
                // 1. 传入的是一个方法通过上面的执行获得的返回值，
                // 如果不是一个有next方法的对象直接resolve出去
                // 2. 传入的不是一个方法且不是一个next方法的对象直接resolve出去
                if (!gen || typeof gen.next !== "function") {
                    return resolve(gen);
                }
                // 执行
                onFulfilled();
                /**
                 * @param {Mixed} res
                 * @return {null}
                 */
                function onFulfilled(res) {
                    var ret;
                    try {
                        // 获取next方法获得的对象，并把上一次的数据传递过去
                        ret = gen.next(res);
                    }
                    catch (e) {
                        // generator 获取下一个yield值发生异常
                        return reject(e);
                    }
                    // 处理yield的值
                    next(ret);
                    return null;
                }
                /**
                 * @param {Error} err
                 * @return {undefined}
                 */
                function onRejected(err) {
                    var ret;
                    try {
                        // 把错误抛到generator里，并且接收下次的
                        ret = gen.throw(err);
                    }
                    catch (e) {
                        // generator 获取下一个yield值发生异常
                        return reject(e);
                    }
                    // 处理yield的值
                    next(ret);
                }
                function next(ret) {
                    // generator执行完并把返回值resolve出去
                    if (ret.done) {
                        return resolve(ret.value);
                    }
                    var value = toPromise(ctx, ret.value);
                    if (value && isPromise(value)) {
                        return value.then(onFulfilled, onRejected);
                    }
                    return onRejected(new TypeError("You may only yield a function, promise,"
                        + " generator, array, or object, "
                        + 'but the following object was passed: "' + String(ret.value) + '"'));
                }
            });
        }
        /**
         * any to Promise
         * @param ctx
         * @param obj
         */
        function toPromise(ctx, obj) {
            if (!obj) {
                return obj;
            }
            if (isPromise(obj)) {
                return obj;
            }
            // 判断是 Generator 对象|方法 直接通过 co 转换为Promise
            if (isGeneratorFunction(obj) || isGenerator(obj)) {
                return co.call(ctx, obj);
            }
            // 判断是个回调方法
            if ("function" === typeof obj) {
                return thunkToPromise(ctx, obj);
            }
            // 判断是个数组
            if (Array.isArray(obj)) {
                return arrayToPromise(ctx, obj);
            }
            if (isObject(obj)) {
                return objectToPromise(ctx, obj);
            }
            return obj;
        }
        function thunkToPromise(ctx, fn) {
            return new Promise(function _p(resolve, reject) {
                fn.call(ctx, function _(err, res) {
                    if (err) {
                        return reject(err);
                    }
                    if (arguments.length > 2) {
                        res = slice.call(arguments, 1);
                    }
                    resolve(res);
                });
            });
        }
        function arrayToPromise(ctx, obj) {
            return Promise.all(obj.map(function (item) { return toPromise(ctx, item); }));
        }
        function objectToPromise(ctx, obj) {
            var results = {};
            var keys = Object.keys(obj);
            var promises = [];
            var _loop_1 = function(i, len) {
                var key = keys[i];
                var val = obj[key];
                var promise = toPromise(ctx, val);
                if (promise && isPromise(promise)) {
                    promises.push(promise.then(function _(res) {
                        results[key] = res;
                    }));
                }
                else {
                    results[key] = val;
                }
            };
            for (var i = 0, len = keys.length; i < len; i++) {
                _loop_1(i, len);
            }
            return Promise.all(promises).then(function _() {
                return results;
            });
        }
        /**
         * is Promise
         * @param {Promise} obj
         * @return {Boolean}
         */
        function isPromise(obj) {
            return "function" === typeof obj.then;
        }
        /**
         * is Generator
         * @param {Generator} obj
         * @return {Boolean}
         */
        function isGenerator(obj) {
            return "function" === typeof obj.next &&
                "function" === typeof obj.throw;
        }
        function isGeneratorFunction(obj) {
            var constructor = obj.constructor;
            if (!constructor) {
                return false;
            }
            if ("GeneratorFunction" === constructor.name ||
                "GeneratorFunction" === constructor.displayName) {
                return true;
            }
            return isGenerator(constructor.prototype);
        }
        function isObject(val) {
            return Object === val.constructor;
        }
        return co;
    })(pro);
}

/**
 * @constructor
 */
var Appoint = (function () {
    function Appoint(resolver) {
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
    Appoint.resolve = function (value) {
        if (value instanceof Appoint) {
            return value;
        }
        return doResolve(new Appoint(INTERNAL), value);
    };
    Appoint.reject = function (error) {
        if (error instanceof Appoint) {
            return error;
        }
        return doReject(new Appoint(INTERNAL), error);
    };
    Appoint.all = function (iterable) {
        var self = this;
        if (!isArray(iterable)) {
            return this.reject(new TypeError("must be an array"));
        }
        var len = iterable.length;
        var called = false;
        if (!len) {
            return this.resolve([]);
        }
        var values = new Array(len);
        var i = -1;
        var promise = new Appoint(INTERNAL);
        while (++i < len) {
            allResolver(iterable[i], i);
        }
        return promise;
        function allResolver(value, index) {
            self.resolve(value).then(resolveFromAll, function (error) {
                if (!called) {
                    called = true;
                    doReject(promise, error);
                }
            });
            function resolveFromAll(outValue) {
                values[index] = outValue;
                if (index === len - 1 && !called) {
                    called = true;
                    doResolve(promise, values);
                }
            }
        }
    };
    Appoint.race = function (iterable) {
        var self = this;
        if (!isArray(iterable)) {
            return this.reject(new TypeError("must be an array"));
        }
        var len = iterable.length;
        var called = false;
        if (!len) {
            return this.resolve([]);
        }
        var values = new Array(len);
        var i = -1;
        var promise = new self(INTERNAL);
        while (++i < len) {
            resolver(iterable[i]);
        }
        return promise;
        function resolver(value) {
            self.resolve(value).then(function (response) {
                if (!called) {
                    called = true;
                    doResolve(promise, response);
                }
            }, function (error) {
                if (!called) {
                    called = true;
                    doReject(promise, error);
                }
            });
        }
    };
    Appoint.polyfill = function () {
        (function _(glo) {
            if (typeof glo.Promise !== "function") {
                glo.Promise = Appoint;
            }
        })(typeof global === "undefined" ? window : global);
    };
    Appoint.prototype.then = function (onFulfilled, onRejected) {
        if (!isFunction(onFulfilled) && this.state === AppointState.FULFILLED ||
            !isFunction(onRejected) && this.state === AppointState.REJECTED) {
            return this;
        }
        var promise = new Appoint(INTERNAL);
        if (this.handled) {
            this.handled = null;
        }
        if (this.getState() !== AppointState.PENDING) {
            var resolver = this.getState() === AppointState.FULFILLED ? onFulfilled : onRejected;
            unwrap(promise, resolver, this.value);
        }
        else {
            this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
        }
        return promise;
    };
    Appoint.prototype.catch = function (onRejected) {
        return this.then(null, onRejected);
    };
    Appoint.prototype.setState = function (state) {
        if (this.state === AppointState.PENDING && this.state !== state) {
            this.state = state;
        }
    };
    Appoint.prototype.getState = function () {
        return this.state;
    };
    Appoint.co = makeCo(Appoint);
    return Appoint;
}());

return Appoint;

})));
//# sourceMappingURL=appoint.js.map
