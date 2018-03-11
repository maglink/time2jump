var $ = require('jquery');
var Cookie = require('./cookie.js');

module.exports.LoadSounds = function(game) {
    game.sounds.masterVolume = 0.5;
    game.sounds.AddBackgroundMusic('echoes_of_time', 'files/music/Echoes_of_Time.mp3', 1);

    game.sounds.AddSound('switch', 'files/sounds/switch.wav');
    game.sounds.AddSound('piston', 'files/sounds/piston.wav', 0.2);
};

module.exports.LoadSoundsSettings = function(game) {
    var soundsVolume = Number(Cookie.getCookie("sounds_volume"));
    if(soundsVolume) {
        game.sounds.SetMasterVolume(soundsVolume);
        $("#sounds_button_cancelled").hide();
        $("#sounds_button").show();
    } else if(soundsVolume === 0) {
        game.sounds.SetMasterVolume(0);
        $("#sounds_button_cancelled").show();
        $("#sounds_button").hide();
    } else {
        game.sounds.SetMasterVolume(1);
        $("#sounds_button_cancelled").hide();
        $("#sounds_button").show();
    }

    $("#sounds_button").click(function () {
        if(game.sounds.masterVolume) {
            game.sounds.lastMasterVolume = game.sounds.masterVolume;
        }
        game.sounds.SetMasterVolume(0);
        $(this).hide();
        $("#sounds_button_cancelled").show();
        Cookie.setCookie("sounds_volume", 0);
    });

    $("#sounds_button_cancelled").click(function () {
        game.sounds.SetMasterVolume(game.sounds.lastMasterVolume || 1);
        $(this).hide();
        $("#sounds_button").show();
        Cookie.setCookie("sounds_volume", game.sounds.masterVolume);
    });
}