/*  author: Ondřej Žára
 *  https://github.com/ondras/star-wars/blob/master/js/promise.js
 */

var Promise = function() {
	this._callbacks = {
		ok: null
	}
	this._thenPromise = null;
}

Promise.prototype.then = function(ok) {
	this._callbacks.ok = ok;
	this._thenPromise = new Promise();
	return this._thenPromise;
}

Promise.prototype.fulfill = function(value) {
	if (!this._callbacks.ok) { return; }

	var result = this._callbacks.ok(value);
	if (result instanceof Promise) {
		result.then(function(value) { 
			this._thenPromise.fulfill(value);
		}.bind(this));
	} else {
		this._thenPromise.fulfill(result);
	}
}