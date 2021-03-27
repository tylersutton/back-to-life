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

Game.Audio = function() {
	this._supported = !!window.Audio;
	this._ext = "mp3";
	
	this._effects = {
		arrow:      { count: 8 },
        levelup:    { count: 1 },
        potion:		{ count: 5 },
        scroll:     { count: 1, volume: 0.3},
	};

	for (var name in this._effects) {
		var data = this._effects[name];
		data.audio = [];
		for (var i=0;i<data.count;i++) {
			var n = name;
			if (data.count > 1) { n += i; }
			var a = new Audio(this._expandName(n));
			a.volume = data.volume || 0.6;
			a.load();
			data.audio.push(a);
		}
	}
};
	
Game.Audio.prototype.play = function(name) {
	if (!this._supported) { return; }
	var data = this._effects[name];
	if (!data) { return; }
	data.audio[Math.floor(Math.random() * data.audio.length)].play();
};

Game.Audio.prototype._expandName = function(name) {
	return "assets/audio/sounds/" + name  + "." + this._ext;
};