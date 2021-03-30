//#region Copyright 
/*
    Copyright (c) 2012, Ondrej Zara
    All rights reserved.

    Redistribution and use in source and binary forms, with or without modification, 
    are permitted provided that the following conditions are met:

    	* Redistributions of source code must retain the above copyright notice, 
    	  this list of conditions and the following disclaimer.
    	* Redistributions in binary form must reproduce the above copyright notice, 
    	  this list of conditions and the following disclaimer in the documentation 
    	  and/or other materials provided with the distribution.
    	* Neither the name of Ondrej Zara nor the names of its contributors may be used 
    	  to endorse or promote products derived from this software without specific 
    	  prior written permission.
    
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
    ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
    IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
    INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
    BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY 
    OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING 
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, 
    EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
//#endregion

Game.Animation = function(properties) {
    this._path = properties.path;
    this._curStep = 0;
    this._delay = 50;
    this._promise = new Game.Promise();
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
    if (this._path && this._curStep > 0) {
        Game.Screen.playScreen.removeEffect(this._path[this._curStep-1].x, this._path[this._curStep-1].y);
    }
    this._promise.fulfill();
};