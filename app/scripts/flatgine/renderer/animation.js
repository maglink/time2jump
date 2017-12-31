module.exports = function (renderer) {
    return function(options) {
        var _self = this;
        options = options || {};

        _self.imagesCount = options.imagesCount || 1;
        _self.imageUrl = options.imageUrl || function(){return ''};
        _self.playMode = options.playMode || 'default';
        _self.playSpeed = options.playSpeed || 1000;
        _self.pauseBetweenLoops = options.pauseBetweenLoops || 0;
        _self.noLoop = options.noLoop || 0;

        _self.currentSlide = 0;
        _self.pingPongMode = 0;
        _self.intervalTimer = null;

        _self.GetCurrentImage = function() {
            return _self.imageUrl(_self.currentSlide)
        };

        _self.changeSlide = function(cb) {
            var prevSlide = _self.currentSlide;

            if(_self.playMode === 'ping-pong'){

                if(_self.pingPongMode === 0) {
                    _self.currentSlide++;
                    if(_self.currentSlide >= _self.imagesCount) {
                        _self.pingPongMode = 1;
                        _self.currentSlide--;
                    }
                } else if(_self.pingPongMode === 1) {
                    _self.currentSlide--;
                    if(_self.currentSlide < 0) {
                        _self.currentSlide = 0;
                        _self.pingPongMode = 0;
                        if(_self.noLoop) {
                            _self.currentSlide = prevSlide;
                            return _self.Pause();
                        }
                        if(_self.pauseBetweenLoops){
                            _self.intervalTimer = setTimeout(function () {
                                _self.Play();
                            }, _self.pauseBetweenLoops);
                            return;
                        }
                    }
                }
            } else {

                _self.currentSlide++;
                if(_self.currentSlide >= _self.imagesCount) {
                    _self.currentSlide = 0;
                    if(_self.noLoop) {
                        _self.currentSlide = prevSlide;
                        return _self.Pause();
                    }
                    if(_self.pauseBetweenLoops){
                        _self.intervalTimer = setTimeout(function () {
                            _self.Play();
                        }, _self.pauseBetweenLoops);
                        return;
                    }
                }
            }

            return 'next';
        };

        _self.Play = function () {
            if(_self.intervalTimer) {
                clearInterval(_self.intervalTimer);
            }

            var waitTime = 1000;
            if(typeof _self.playSpeed === 'number') {
                waitTime = _self.playSpeed;
            } else if(typeof _self.playSpeed === 'function') {
                waitTime = _self.playSpeed();
            }

            _self.intervalTimer = setTimeout(function () {
                if(_self.changeSlide() === 'next') {
                    _self.Play();
                }
            }, waitTime);

            return _self;
        };

        _self.Pause = function () {
            if(_self.intervalTimer) {
                clearInterval(_self.intervalTimer);
            }
            _self.intervalTimer = null;
            return _self;
        };

        _self.Stop = function () {
            _self.Pause();
            _self.currentSlide = 0;
            _self.pingPongMode = 0;
            return _self;
        };

        (function(){
            for(var i=0;i<_self.imagesCount;i++){
                renderer.LoadImage(_self.imageUrl(i))
            }
        })();

        return _self;
    }
};