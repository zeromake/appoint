!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):n.Appoint=t()}(this,function(){"use strict";function n(){return void 0!==d?function(){d(e)}:t()}function t(){var n=setTimeout;return function(){return n(e,1)}}function e(){for(var n=0;n<v;n+=2)(0,F[n])(F[n+1]),F[n]=void 0,F[n+1]=void 0;v=0}function r(){}function o(n){return"function"==typeof n}function i(n){return"object"==typeof n}function u(n){return"[object Array]"===Object.prototype.toString.call(n)}function c(n){var t=n&&n.then;if(n&&(i(n)||o(n))&&o(t))return o(t.bind)?t.bind(n):function(e,r){return t.call(n,e,r)}}function f(n,t,e){w(function(){var r;try{r=t(e)}catch(t){return l(n,t)}r===n?l(n,new TypeError("Cannot resolve promise with itself")):a(n,r)})}function a(n,t){try{var e=c(t);return e?s(n,e):(n.setState(p.FULFILLED),n.value=t,n.queue.forEach(function(n){n.callFulfilled(t)})),n}catch(t){return l(n,t)}}function s(n,t){var e=!1;try{t(function(t){e||(e=!0,a(n,t))},function(t){e||(e=!0,l(n,t))})}catch(t){if(e)return;e=!0,l(n,t)}}function l(n,t){return n.setState(p.REJECTED),n.value=t,console.log("no async",n.handled),n.handled&&w(function(){console.log("async",n.handled),n.handled&&("undefined"!=typeof process?process.emit("unhandledRejection",t,n):console.error(t))}),n.queue.forEach(function(n){n.callRejected(t)}),n}function h(n){return function(n){function t(n,t){return t?i(t)?t:c(t)||u(t)?s.call(n,t):"function"==typeof t?e(n,t):Array.isArray(t)?r(n,t):f(t)?o(n,t):t:t}function e(t,e){return new n(function(n,r){e.call(t,function(t,e){if(t)return r(t);arguments.length>2&&(e=a.call(arguments,1)),n(e)})})}function r(e,r){return n.all(r.map(function(n){return t(e,n)}))}function o(e,r){for(var o={},u=Object.keys(r),c=[],f=0,a=u.length;f<a;f++)!function(n,f){var a=u[n],s=r[a],l=t(e,s);l&&i(l)?c.push(l.then(function(n){o[a]=n})):o[a]=s}(f);return n.all(c).then(function(){return o})}function i(n){return"function"==typeof n.then}function u(n){return"function"==typeof n.next&&"function"==typeof n.throw}function c(n){var t=n.constructor;return!!t&&("GeneratorFunction"===t.name||"GeneratorFunction"===t.displayName||u(t.prototype))}function f(n){return Object===n.constructor}var a=Array.prototype.slice,s=function(e){var r=this,o=a.call(arguments,1);return new n(function(n,u){function c(n){var t;try{t=e.next(n)}catch(n){return u(n)}return a(t),null}function f(n){var t;try{t=e.throw(n)}catch(n){return u(n)}a(t)}function a(e){if(e.done)return n(e.value);var o=t(r,e.value);return o&&i(o)?o.then(c,f):f(new TypeError('You may only yield a function, promise, generator, array, or object, but the following object was passed: "'+String(e.value)+'"'))}if("function"==typeof e&&(e=e.apply(r,o)),!e||"function"!=typeof e.next)return n(e);c()})};return s.wrap=function(n){var t=function(){return s.call(this,n.apply(this,arguments))};return t.__generatorFunction__=n,t},s}(n)}var p;!function(n){n[n.PENDING=0]="PENDING",n[n.FULFILLED=1]="FULFILLED",n[n.REJECTED=2]="REJECTED"}(p||(p={}));var d,y,v=0,w=function(n,t){F[v]=n,F[v+1]=t,2===(v+=2)&&y()},E="undefined"!=typeof window?window:void 0,m=E||{},b=m.MutationObserver||m.WebKitMutationObserver,g="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),j="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,F=new Array(1e3);y=g?function(){return process.nextTick(e)}:b?function(){var n=0,t=new b(e),r=document.createTextNode("");return t.observe(r,{characterData:!0}),function(){r.data=n=++n%2}}():j?function(){var n=new MessageChannel;return n.port1.onmessage=e,function(){return n.port2.postMessage(0)}}():void 0===E&&"function"==typeof require?function(){try{var e=require("vertx");return d=e.runOnLoop||e.runOnContext,n()}catch(n){return t()}}():t();var L=function(){return function(n,t,e){this.promise=n,o(t)?this.callFulfilled=function(n){f(this.promise,t,n)}:this.callFulfilled=function(n){a(this.promise,n)},o(e)?this.callRejected=function(n){f(this.promise,e,n)}:this.callRejected=function(n){l(this.promise,n)}}}();return function(){function n(n){if(!o(n))throw new TypeError("resolver must be a function");this.state=p.PENDING,this.value=void 0,this.queue=[],this.handled=!0,n!==r&&s(this,n)}return n.resolve=function(t){return t instanceof n?t:a(new n(r),t)},n.reject=function(t){return t instanceof n?t:l(new n(r),t)},n.all=function(t){var e=this;if(!u(t))return this.reject(new TypeError("must be an array"));var o=t.length,i=!1;if(!o)return this.resolve([]);for(var c=new Array(o),f=-1,s=new n(r);++f<o;)!function(n,t){e.resolve(n).then(function(n){c[t]=n,t!==o-1||i||(i=!0,a(s,c))},function(n){i||(i=!0,l(s,n))})}(t[f],f);return s},n.race=function(n){var t=this;if(!u(n))return this.reject(new TypeError("must be an array"));var e=n.length,o=!1;if(!e)return this.resolve([]);new Array(e);for(var i=-1,c=new t(r);++i<e;)!function(n){t.resolve(n).then(function(n){o||(o=!0,a(c,n))},function(n){o||(o=!0,l(c,n))})}(n[i]);return c},n.polyfill=function(){!function(t){"function"!=typeof t.Promise&&(t.Promise=n)}("undefined"==typeof global?window:global)},n.prototype.then=function(t,e){if(!o(t)&&this.state===p.FULFILLED||!o(e)&&this.state===p.REJECTED)return this;var i=new n(r);return this.handled&&(this.handled=!1),this.getState()!==p.PENDING?f(i,this.getState()===p.FULFILLED?t:e,this.value):this.queue.push(new L(i,t,e)),i},n.prototype.catch=function(n){return this.then(null,n)},n.prototype.setState=function(n){this.state===p.PENDING&&this.state!==n&&(this.state=n)},n.prototype.getState=function(){return this.state},n.co=h(n),n}()});
