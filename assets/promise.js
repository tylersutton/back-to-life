/*  author: Ondřej Žára
 *  https://github.com/ondras/star-wars/blob/master/js/promise.js
 */

Game.Promise = function() {
	this._callbacks = {
		ok: null
	};
	this._thenPromise = null;
};

Game.Promise.prototype.then = function(ok) {
	this._callbacks.ok = ok;
	this._thenPromise = new Game.Promise();
	return this._thenPromise;
};

Game.Promise.prototype.fulfill = function(value) {
	if (!this._callbacks.ok) { return; }

	var result = this._callbacks.ok(value);
	if (result instanceof Game.Promise) {
		result.then(function(value) { 
			this._thenPromise.fulfill(value);
		}.bind(this));
	} else {
		this._thenPromise.fulfill(result);
	}
};