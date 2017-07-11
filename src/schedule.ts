declare const process: any;
declare const global: any;
declare const Promise: any;
declare const window: any;

// copy to https://github.com/petkaantonov/bluebird/blob/master/src/schedule.js
let schedule;
const noAsyncScheduler = function noAsyncScheduler() {
    throw new Error("NO_ASYNC_SCHEDULER");
};
const isNode = typeof process !== "undefined" &&
        Object.prototype.toString.call(process).toLowerCase() === "[object process]";
const util = {
    isNode,
    isRecentNode: isNode && (function isRecentNode() {
        const version = process.versions.node.split(".").map(Number);
        return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
    })(),
    getNativePromise() {
        if (typeof Promise === "function") {
            try {
                const promise = new Promise(function _(){ return void 0; });
                if ({}.toString.call(promise) === "[object Promise]") {
                    return Promise;
                }
            } catch (e) {
                return void 0;
            }
        }
    },
};
const NativePromise = util.getNativePromise();
// 如果是node环境且MutationObserver不存在使用setImmediate或process.nextTick
if (util.isNode && typeof MutationObserver === "undefined") {
    const GlobalSetImmediate = global.setImmediate;
    const ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function _() {
                    GlobalSetImmediate(makeFunction(this, arguments));
                }
                : function _() {
                    ProcessNextTick(makeFunction(this, arguments));
                };
// 如果能够获取原生Promise使用Promise
} else if (typeof NativePromise === "function" &&
           typeof NativePromise.resolve === "function") {
    const nativePromise = NativePromise.resolve();
    schedule = function _() {
        nativePromise.then(makeFunction(this, arguments));
    };
// 使用MutationObserver
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            (window.navigator.standalone || window.cordova))) {
    schedule = (function _() {
        const div = document.createElement("div");
        const opts = { attributes: true };
        let toggleScheduled = false;
        const div2 = document.createElement("div");
        const o2 = new MutationObserver(function Observer() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        const scheduleToggle = function scheduleToggle() {
            if (toggleScheduled) {
                return;
            }
            toggleScheduled = true;
            div2.classList.toggle("foo");
        };

        return function schedule() {
            const newFun = makeFunction(this, arguments);
            const o = new MutationObserver(function _() {
                o.disconnect();
                newFun();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
// 浏览器中的setImmediate为备选
} else if (typeof setImmediate !== "undefined") {
    schedule = function schedule() {
        setImmediate(makeFunction(this, arguments));
    };
// 最慢的setTimeout
} else if (typeof setTimeout !== "undefined") {
    schedule = function schedule() {
        setTimeout(makeFunction(this, arguments), 0);
    };
// 不支持异步
} else {
    schedule = noAsyncScheduler;
}

function makeFunction(ctx, args) {
    const len = args.length;
    if (len === 0 || typeof args[0] !== "function") {
        throw Error("not function");
    }
    const fun = args[0];
    const callback = len > 1 ? args[1] : null;
    const funArgs: any[] = Array.prototype.slice.call(args, 2);
    return () => {
        const res = fun.apply(ctx, funArgs);
        if (typeof callback === "function") {
            callback(res);
        }
    };
}

export default schedule;
