#!/usr/bin/env nodejs
// Made by Tobias "Kappty" Kaptain.
// www.kappty.com
// Bot used for www.twitch.tv/kregme

"use strict";
// Import modules
var tmi = require('tmi.js');
var request = require('request');
var cheerio = require('cheerio');

// Setting dathost settings
var dhuser = 'EMAIL',
    dhpass = 'PASSWORD';

var startserver = 'https://' + dhuser + ':' + dhpass + '@dathost.net/api/0.1/game-servers/SERVERID/start';
var stopserver = 'https://' + dhuser + ':' + dhpass + '@dathost.net/api/0.1/game-servers/SERVERID/stop';
var gameserver = 'https://' + dhuser + ':' + dhpass + '@dathost.net/api/0.1/game-servers/SERVERID';

// Setting RCON settings
let Rcon = require('srcds-rcon');
let rcon = Rcon({
    address: 'IP:PORT',
    password: 'PASSWORD'
});

// Setting TMI settings
var options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: "BOTNAME",
        password: "oauth:KEY"
    },
    channels: ["CHANNELNAME"]
};

// Starting connection
var client = new tmi.client(options);
client.connect();

// Creating empty variables
var params, command, hasParams, userParam, token, execrcon, usercon, rconparam, rconparamtwo, formData, serverstatus;

// Creating the function to change password
function changepassword()
{
    var token = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        token += possible.charAt(Math.floor(Math.random() * possible.length));

    rcon.connect().then(() => {
        return rcon.command('sv_password ' + token).then(() => {
            console.log('changed password');
});
}).then(
    () => rcon.disconnect()
).catch(err => {
    console.log('caught', err);
    console.log(err.stack);
});
    return token;
}

function usercon(rconparam,rconparamtwo)
{
    if(rconparam === "changelevel")
    {
        execrcon = "changelevel " + rconparamtwo;
    }

    rcon.connect().then(() => {
        return rcon.command(execrcon).then(() => {
            console.log('Ran RCON command' + execrcon);
});
}).then(
    () => rcon.disconnect()
).catch(err => {
    console.log('caught', err);
    console.log(err.stack);
});
}

// Message response
// Script modified from https://gist.github.com/AlcaDesign/fdae684a37249923eea77a1b01d467df
client.on('message', function (channel, user, message, fromSelf) {
    // Ignore bot's messages.
    if (fromSelf) {
        return false;
    }

    // The name of the user. (Will default to the lower case if the display name
    // is missing from the user object.)
    var name = user['display-name'] || user.username,

        // A pre-formatted string to go at the beginning of command outputs.
        greeting = '@' + name + ',';
    // The text in the message split by spaces for easy use.
    params = message
    // Remove extra whitespace on ends.
        .trim()
        // Replace multiple spaces with 1.
        .replace(/\s{2,}/g, ' ')
        // Split the string at spaces.
        .split(' '),
        // Remove and return the first element.
        command = params.shift(),
        // Are there reamining parameters?
        hasParams = params.length > 0,
        // Default to the user if there's no first parameter.
        userParam = hasParams ? params[0] : user.username;

    // Is it a command?
    if (command[0] === '!') {
        // Remove the exclamation mark
        command = command.replace(/^!+/, '');
    }
    // Wasn't a command, ignore this normal message.
    else {
        return false;
    }

    // Controlling mod status, and name - Super mod
    if(user.mod && name.toLowerCase() === "USERNAME") {

        // Startserver command
        if(command === 'startserver') {
            client.say(channel, "Starter server!");
            request.post({url: startserver}, function (error, response, body) {
                console.log(body);
            });
        };

        // Stopserver command
        if(command === 'stopserver') {
            client.say(channel, "Stopper server!");
            request.post({url: stopserver}, function (error, response, body) {
                console.log(body);
            });
        };

        // Serverstatus command
        if(command === 'serverstatus') {
            request.get({url: gameserver}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    serverstatus = JSON.parse(body);

                    if(serverstatus.on === false) {
                        client.say(channel, "Server er offline.");
                    }
                    if(serverstatus.on === true) {
                        client.say(channel, "Server er online.");
                        client.say(channel, "Der er " + serverstatus.status[1].value + " players på " + serverstatus.status[0].value);
                    }
                }
            });
        };

        // Resetpass command
        if(command === 'resetpass') {
            var returntoken = changepassword();
            client.say(channel, name + " Password er nulstillet, se nyt i whisper.");
            client.whisper(name, "Password ændret: connect SERVERIP:PORT; password " + returntoken);
        }

        // Changelevel command
        if(command === 'changelevel') {
            client.say(channel, "Map ændres til: " + userParam);

            // Call the usercon fucntion
            usercon("changelevel", userParam);
        }

        // Startscrim command
        if(command === 'startscrim') {

            // Call the changepassword function
            var returntoken = changepassword();

            // Then giving output in chat and whisper to the user
            client.say(channel, "Ny scim startet! Info er som følger:");
            client.say(channel, "connect SERVERIP:PORT; password " + returntoken);
        }
    }

    // If no command matches, return false
    else {
        return false;
    }
});