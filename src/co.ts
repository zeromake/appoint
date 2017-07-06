const slice = Array.prototype.slice;

function co(gen) {
    const ctx = this;
    const args = slice.call(arguments, 1);
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
        function onFulfilled(res?: any) {
            let ret;
            try {
                // 获取next方法获得的对象，并把上一次的数据传递过去
                ret = gen.next(res);
            } catch (e) {
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
            let ret;
            try {
                // 把错误抛到generator里，并且接收下次的yield
                ret = gen.throw(err);
            } catch (e) {
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
            const value = toPromise(ctx, ret.value);

        }
    });
}
/**
 * any to Promise
 * @param ctx
 * @param obj
 */
function toPromise(ctx: any, obj: any) {
    if (!obj) { return obj; }
    if (isPromise(obj)) { return obj; }
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
            if (err) { return reject(err); }
            if (arguments.length > 2) {
                res = slice.call(arguments, 1);
            }
            resolve(res);
        });
    });
}

function arrayToPromise(ctx, obj: any[]) {
    return Promise.all(obj.map((item) => toPromise(ctx, item)));
}

function objectToPromise(ctx, obj) {
    const results = {};
    const keys = Object.keys(obj);
    const promises = [];
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const val = obj[key];
        const promise = toPromise(ctx, val);
        if (promise && isPromise(promise)) {
            promises.push(promise.then(function _(res) {
                results[key] = res;
            }));
        } else {
            results[key] = val;
        }
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
function isPromise(obj: { then: (...args: any[]) => any }) {
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
    const constructor = obj.constructor;
    if (!constructor) { return false; }
    if ("GeneratorFunction" === constructor.name ||
        "GeneratorFunction" === constructor.displayName) {
        return true;
    }
    return isGenerator(constructor.prototype);
}

function isObject(val) {
    return Object === val.constructor;
}
