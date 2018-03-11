module.exports = function(game, onCharDie) {
    var _self = this;

    _self.game = game;
    _self.body = null;

    _self.nextActions = [];

    _self.CreateBody = function (game) {
        _self.body = game.world.AddBody({
            width: 0.45,
            height: 0.96,
            image: _self.imageStand,
            friction: 0
        });

        _self.body.renderer.yOffset = -1*(128-128*0.96)/2;

        _self.game.world.AddBodyEventListener(_self.body, 'onGridTouch', function (event) {
            if(event.side === 'bottom') {
                _self.isGrounded = true;
                return;
            }
            if(event.side === 'top') {
                _self.isJumping = false;
                return;
            }
        });
        _self.body.physics.collideObjectsFilter = function(other){
            return other.type !== "warp";
        };
        _self.game.world.AddBodyEventListener(_self.body, 'onObjectTouch', function (event) {

            if(event.object.type === 'stone' && event.axis === 'x') {
                _self.stoneTouch = event.object;
                if(_self.stoneTouchTimeout) {
                    clearTimeout(_self.stoneTouchTimeout);
                }
                _self.stoneTouchTimeout = setTimeout(function() {
                    _self.stoneTouch = null;
                }, 1000/20);
            }

            if(event.side === 'bottom') {
                _self.isGrounded = true;
            }

        });
        game.world.AddBodyEventListener(_self.body, 'onZoneIn', function (zone) {
            if(zone.action) {
                _self.nextActions.push(zone.action);
            }

            if(zone.name === "warp") {
                onCharDie("warp");
            }
        });
        game.world.AddBodyEventListener(_self.body, 'onZoneOut', function (zone) {
            if(zone.action) {
                var index= _self.nextActions.indexOf(zone.action);
                if(index !== -1) {
                    _self.nextActions.splice(index, 1);
                }
            }
        });
    };

    _self.game.controlKeys.AddKeyHandlers({
        keyName: "A/up",
        keyChars: ["ArrowUp", "W", "w", " ", "K", "k", "Ц", "ц", "Л", "л"],
        handlerPress: function () {
            if(_self.stoneTouchActionStarted){
                return;
            }
            if(_self.isGrounded) {
                _self.isJumping = true;
                _self.jumpIterationCount = 0;
            }
        },
        handlerRelease: function () {
            _self.isJumping = false;
        }
    });
    _self.game.controlKeys.AddKeyHandlers({
        keyName: "B",
        keyChars: ["Shift", "J", "j", "О", "о"],
        handlerPress: function () {
            if(_self.stoneTouch) {
                _self.stoneTouchActionStart();
                return;
            }

            if(_self.nextActions.length) {
                _self.nextActions[_self.nextActions.length-1]();
            }
        },
        handlerRelease: function () {
            if(_self.stoneTouchActionStarted) {
                _self.stoneTouchActionEnd()
            }
        }
    });
    _self.game.controlKeys.AddKeyHandlers({
        keyName: "left",
        keyChars: ["ArrowLeft", "A", "a", "Ф", "ф"],
        handlerPress: function () {
            _self.isRunning = true;
            _self.runningSide = 'left';
            _self.runIterationCount = 0;
        },
        handlerRelease: function () {
            if(_self.runningSide !== 'right') {
                _self.isRunning = false;
            }
        }
    });
    _self.game.controlKeys.AddKeyHandlers({
        keyName: "right",
        keyChars: ["ArrowRight", "D", "d", "В", "в"],
        handlerPress: function () {
            _self.isRunning = true;
            _self.runningSide = 'right';
            _self.runIterationCount = 0;
        },
        handlerRelease: function () {
            if(_self.runningSide !== 'left') {
                _self.isRunning = false;
            }
        }
    });

    _self.game.physics.Before(function () {
        if(_self.isDead || _self.isTeleporting || _self.isFinish) {
            _self.beforeRender();
            return;
        }

        if(_self.isJumping) {
            if(_self.jumpIterationCount++ === 0) {
                _self.body.physics.vy = _self.jumpMinHeight*(_self.jumpTime/1000);
            } else if(_self.jumpIterationCount < _self.jumpTime/_self.game.physics.timeFrequency) {
                _self.body.physics.vy += (_self.jumpMaxHeight*(_self.jumpTime/1000) - _self.jumpMinHeight*(_self.jumpTime/1000))/_self.game.physics.timeFrequency;
            }
        }

        if(_self.isRunning) {
            var rate = (1/(_self.runStartTime/_self.game.physics.timeFrequency));

            if(_self.runningSide === 'left') {
                _self.body.physics.vx += rate * _self.runSpeed * -1;
                if(_self.body.physics.vx < _self.runSpeed * -1) {
                    _self.body.physics.vx = _self.runSpeed * -1;
                }
            } else {
                _self.body.physics.vx += rate * _self.runSpeed;
                if(_self.body.physics.vx > _self.runSpeed) {
                    _self.body.physics.vx = _self.runSpeed;
                }
            }
        } else {
            _self.body.physics.vx *= 1 - 0.2;
        }

        setTimeout(function () {
            _self.isGrounded = false;
        }, 0);

        if(_self.stoneTouchActionStarted && _self.stoneTouchSaved) {
                _self.stoneTouchSaved.physics.vx = _self.body.physics.vx;
        }
    });

    _self.game.physics.After(function () {
        _self.beforeRender();
    });

    _self.setImage = function(image) {
        var old = _self.body.renderer.image;
        if(old === image) {
            return;
        }
        if(old && old.Stop) {
            old.Stop();
        }
        _self.body.renderer.image = image;
        if(image && image.Play) {
            image.Play();
        }
    };

    _self.isGrounded = true;
    _self.isDucking = false;
    _self.isRunning = false;

    _self.jumpTime = 500;
    _self.jumpMinHeight = 8;
    _self.jumpMaxHeight = 18;
    _self.isJumping = false;
    _self.jumpIterationCount = 0;

    _self.runStartTime = 500;
    _self.runIterationCount = 0;
    _self.runSpeedDefault = 2;
    _self.runSpeed = _self.runSpeedDefault;
    _self.isRunning = false;
    _self.runningSide = '';


    _self.imageDuck = _self.game.renderer.LoadImage('files/char/stand/1.png');
    _self.imageJump = _self.game.renderer.LoadImage('files/char/jump.png');
    _self.imageSkid = _self.game.renderer.LoadImage('files/char/stand/1.png');
    _self.imageRun = new _self.game.renderer.animation({
        imagesCount: 6,
        imageUrl: function(i) {
            return 'files/char/run/'+(i+1)+".png"
        },
        playSpeed: function(){
            var add = 16*(Math.abs(_self.body.physics.vx)/_self.runSpeed);
            return 1000/(4+add);
        }
    });
    _self.imagePullNPush = _self.game.renderer.LoadImage('files/char/stand/3.png');
    _self.imageStand1 = _self.game.renderer.LoadImage('files/char/stand/1.png');
    _self.imageStand2 = new _self.game.renderer.animation({
        imagesCount: 11,
        imageUrl: function(i) {
            return 'files/char/stand/'+(i+1)+".png"
        },
        playSpeed: 1000/5,
        noLoop: true
    });
    _self.imageStand = _self.imageStand1;

    _self.standAnimationInterval = setInterval(function() {
        if(Math.random() > 0.6) {
            _self.imageStand = _self.imageStand2.Stop().Play();
            setTimeout(function() {
                _self.imageStand = _self.imageStand1;
            }, (1000/5 * 11))
        }
    }, 5000);

    _self.beforeRender = function () {
        if(_self.stoneTouchActionStarted) {
            _self.setImage(_self.imagePullNPush);


            if(_self.isGrounded && Math.abs(_self.body.physics.vx) > 0.05) {
                if (_self.audioBlockMovingOffCancel) {
                    _self.audioBlockMovingOffCancel();
                    _self.audioBlockMovingOffCancel = null;
                }
                if (_self.audio.blockMoving.paused) {
                    _self.audio.blockMoving.play()
                }
            } else {
                if(!_self.audioBlockMovingOffCancel) {
                    _self.audioBlockMovingOffCancel = _self.audioSmoothPause(_self.audio.blockMoving);
                }
            }

            return;
        }
        if(!_self.audioBlockMovingOffCancel) {
            _self.audioBlockMovingOffCancel = _self.audioSmoothPause(_self.audio.blockMoving);
        }



        if(!_self.isGrounded) {
            _self.imageStand = _self.imageStand1;
            _self.setImage(_self.imageJump);
        } else if(_self.isDucking) {
            _self.setImage(_self.imageDuck);
        } else if(_self.isRunning && _self.isGrounded) {
            _self.imageStand = _self.imageStand1;
            if((_self.runningSide === 'left' && _self.body.physics.vx > 0)
                || (_self.runningSide === 'right' && _self.body.physics.vx < 0)) {
                _self.setImage(_self.imageSkid);
            } else {
                _self.setImage(_self.imageRun);
            }
            if(!_self.stoneTouchActionStarted) {
                if(_self.runningSide === 'left') {
                    _self.body.renderer.flip = true;
                } else {
                    _self.body.renderer.flip = false;
                }
            }
        } else if(Math.abs(_self.body.physics.vx) > 0.05) {
            _self.imageStand = _self.imageStand1;
            _self.setImage(_self.imageRun);
        } else {
            _self.setImage(_self.imageStand);
        }

        if(_self.isGrounded && Math.abs(_self.body.physics.vx) > 0.05) {
            var speed = Math.abs(_self.body.physics.vx)/2;
            speed *= 2;
            if(speed < 1) {
                speed = 1;
            } else if(speed > 2) {
                speed = 2
            }
            if(_self.audioStepsOffCancel) {
                _self.audioStepsOffCancel();
                _self.audioStepsOffCancel = null;
            }
            if(Math.abs(_self.audio.steps.playbackRate - speed) > 0.2) {
                _self.audio.steps.playbackRate = speed;
            }
            if(_self.audio.steps.paused) {
                _self.audio.steps.play();
            }
        } else {
            if(!_self.audioStepsOffCancel) {
                _self.audioStepsOffCancel = _self.audioSmoothPause(_self.audio.steps);
            }
        }

    };


    _self.stoneTouchActionStart = function() {
        _self.stoneTouchActionStarted = true;
        _self.stoneTouchSaved = _self.stoneTouch;
        _self.stoneTouchXDiff = _self.stoneTouchSaved.physics.x - _self.body.physics.x;

        if(_self.body.physics.x < _self.stoneTouchSaved.physics.x) {
            _self.body.physics.x -= 0.05;
            _self.body.renderer.flip = false;
        } else {
            _self.body.physics.x += 0.05;
            _self.body.renderer.flip = true;
        }


        _self.runSpeed = 0.5;
    };

    _self.stoneTouchActionEnd = function() {
        _self.stoneTouchActionStarted = false;
        _self.stoneTouchSaved = null;
        _self.runSpeed = _self.runSpeedDefault;
    };


    _self.audio = {};
    _self.audio.steps = (function(){
        var audio = new Audio();
        audio.src = 'files/sounds/footsteps.wav';
        audio.load();
        audio.playbackRate = 2;
        audio.loop = true;
        audio.volume = game.sounds.masterVolume;
        audio.originalVolume = game.sounds.masterVolume;
        game.sounds.OnMasterVolumeChange(function(volume){
            audio.volume = volume;
            audio.originalVolume = volume;
        });

        return audio;
    })();

    _self.audio.blockMoving = (function(){
        var audio = new Audio();
        audio.src = 'files/sounds/block-moving.wav';
        audio.load();
        audio.playbackRate = 1;
        audio.loop = true;
        audio.volume = game.sounds.masterVolume;
        audio.originalVolume = game.sounds.masterVolume;
        game.sounds.OnMasterVolumeChange(function(volume){
            audio.volume = volume;
            audio.originalVolume = volume;
        });
        return audio;
    })();

    _self.audioSmoothPause = function(audio) {
        var outLength = 100;
        var outSpeed = outLength/(1000/30);

        var interval = setInterval(function () {
            var volume = audio.volume;
            volume -= (audio.originalVolume/outSpeed);
            volume = Math.floor(volume/0.001)*0.001;
            if(volume <= 0) {
                audio.volume = audio.originalVolume;
                audio.pause();
                clearInterval(interval);
                return;
            }
            audio.volume = volume;
        }, 1000/30);

        return function () {
            audio.volume = audio.originalVolume;
            clearInterval(interval);
        };
    };


    return _self;
};