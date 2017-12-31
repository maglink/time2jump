module.exports = function () {
    var _self = this;

    _self.channels = [];
    for(var i=0;i<8;i++){
        _self.channels.push(new Audio());
    }
    _self.backChannel = new Audio();

    _self.masterVolume = 1;

    _self.SetMasterVolume = function (masterVolume) {
        _self.masterVolume = masterVolume;
        _self.channels.forEach(function(channel){
            channel.volume = (channel.volumeOriginal || 1) * _self.masterVolume;
        });
        _self.backChannel.volume = (_self.backChannel.volumeOriginal || 1) * _self.masterVolume;
    };


    _self.backList = {};
    _self.AddBackgroundMusic  = function(name, url, volume) {
        if(_self.backList[name]) {
            return;
        }
        _self.backList[name] = {
            url: url,
            volume: volume || 1
        }
    };
    _self.PlayBackground = function (name) {
        if(!_self.backList[name]) {
            return;
        }

        var track = _self.backList[name];
        _self.backChannel.loop = true;
        _self.backChannel.src = track.url;
        _self.backChannel.volume = track.volume * _self.masterVolume;
        _self.backChannel.volumeOriginal = track.volume;
        _self.backChannel.play();
    };
    _self.StopBackground = function () {
        _self.backChannel.pause();
        _self.backChannel.currentTime = 0;
    };


    _self.soundList = {};
    _self.AddSound = function(name, url, volume) {
        if(_self.soundList[name]) {
            return;
        }

        var audio = new Audio();
        audio.src = url;
        audio.load();

        _self.soundList[name] = {
            audio: audio,
            volume: volume || 1
        }
    };

    _self.Play = function(name) {
        if(!_self.soundList[name]) {
            return
        }
        var track = _self.soundList[name];

        for(var i=0;i<_self.channels.length;i++){
            var channel = _self.channels[i];
            if(!_self.soundIsPlaying(channel)) {
                channel.src = track.audio.src;
                channel.volume = track.volume * _self.masterVolume;
                channel.volumeOriginal = track.volume;
                channel.play();
                return;
            }
        }
    };

    _self.soundIsPlaying = function (channel) {
        return !channel.ended && channel.src !== '';
    };

    return _self;
};