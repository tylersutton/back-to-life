Game.Animation = function(properties) {
    this._path = properties['path'];
    this._curStep = 0;
    this._delay = 50;
    this._promise = new Promise();
    this._effects = null;
    this._char = '~';
};

Game.Animation.prototype.go = function() {
	this.step();
	return this._promise;
};

Game.Animation.prototype.setDelay = function(delay) {
	this._delay = delay;
	return this;
};

Game.Animation.prototype.step = function() {
    if (this._curStep != 0) {
        Game.Screen.playScreen.removeEffect(this._path[this._curStep-1].x, this._path[this._curStep-1].y);
    }
    if (!this._path || this._curStep === this._path.length) {
        this.done();
        return;
    }
    Game.Screen.playScreen.addEffect(this._path[this._curStep].x, this._path[this._curStep].y, this._char);
    
    this._curStep++;
    setTimeout(this.step.bind(this), this._delay);
};

Game.Animation.prototype.done = function() {
    console.log("promise fulfilled");
    if (this._path && this._curStep > 0) {
        Game.Screen.playScreen.removeEffect(this._path[this._curStep-1].x, this._path[this._curStep-1].y);
    }
    this._promise.fulfill();
};