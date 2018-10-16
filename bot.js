// Require Packages and Files
const Discord = require('discord.js');
const config = require('./config.json');
const Fortnite = require("fortnite-api");
const Twitter = require('twitter');
const mysql = require('mysql');
const fs = require('fs');
const ms = require('ms');

// Create clients
const client = new Discord.Client();
let fortniteAPI = new Fortnite(
    [
        config.ftnemail,
        config.ftnpwd,
        config.ftnclt,
        config.ftnfct
    ], {
        debug: true
    }
);
const twitClient = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'FortniteGamer'
});


// Default variables
// Twitter
const params = {
    screen_name: 'FortniteGame'
};
var id_str = '';
// Colors
let infoColor = "#FFFFFF"
let ftnColor = '#761FA1'
let errColor = '#FF0000'


// When bot is up and running
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // getFortniteUpdate()
    // setInterval(getFortniteUpdate, 300000);
});

// Login in to the Fortnite API
fortniteAPI.login().then(() => {

    // On Message
    client.on('message', (message) => {
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        // CPU Reduction
        if (!message.content.startsWith(config.prefix) || message.author.bot) return;

        // Fortnite Command
        if (command == '') {
            console.log(args[0])
            if (message.mentions.members.first()) {
                let userid = message.mentions.members.first().id
                let getFtnlink = `SELECT * FROM ftnlink WHERE userid=?`;
                connection.query(getFtnlink, [userid], (error, results, fields) => {
                    if (results.length == 0) {
                        message.channel.send("This user has not linked his account")
                    } else {
                        var username = results[0].username
                        var platform = results[0].platform
                        message.channel.send(`Username: ${username}, Platform: ${platform}`)
                    }
                    if (error) {
                        return console.error(error.message);
                    }
                });
            } else if (!command) {
                let userid = message.author.id
                let getFtnlink = `SELECT * FROM ftnlink WHERE userid=?`;
                connection.query(getFtnlink, [userid], (error, results, fields) => {
                    if (results.length == 0) {
                        message.channel.send("You have not linked your account")
                    } else {
                        var username = results[0].username
                        var platform = results[0].platform
                        message.channel.send(`Username: ${username}, Platform: ${platform}`)
                    }
                    if (error) {
                        return console.error(error.message);
                    }
                });
            } else {
                var username = command
                var platform = 'pc'
                message.channel.send(`Username: ${username}, Platform: ${platform}`)
            }
            console.log(username, platform)

            fortniteAPI
                .getStatsBR(username, platform, "alltime")
                .then(stats => {
                    let embed = new Discord.RichEmbed()
                        .setTitle("Fortnite Stats")
                        .setDescription(`The Fortnite Stats of ${username} on ${platform.toUpperCase()}`)
                        .setColor(ftnColor)
                        .addField("Name", username, true)
                        .addField("Platform", platform.toUpperCase(), true)
                        .addField("Kills", stats.lifetimeStats.kills, true)
                        .addField("Wins", stats.lifetimeStats.wins, true)
                        .addField("Win%", `${Math.round(((stats.lifetimeStats.wins / stats.lifetimeStats.matches) * 100) * 100) / 100}%`, true)
                        .addField("K/D", Math.round((stats.lifetimeStats.kills / (stats.lifetimeStats.matches - stats.lifetimeStats.wins)) * 100) / 100, true);
                    message.channel.send(embed)
                })
                .catch(err => {
                    console.log(err)
                });

        }

        if (command == 'link') {

            // Create MySQL Table
            let createFtnlink = `create table if not exists ftnlink(
                          userid varchar(255) not null,
                          username varchar(255)not null,
                          platform varchar(255) not null
                      )`;
            connection.query(createFtnlink, function (err, results, fields) {
                if (err) {
                    console.log(err.message);
                }
            });
            let userid = message.author.id
            let linkPlatform = args[0]
            let linkName = args[1]

            let ftnInsert = `INSERT INTO ftnlink(userid, username, platform) VALUES(?,?,?)`;
            let insertment = [userid, linkName, linkPlatform];
            // Execute Insert
            connection.query(ftnInsert, insertment, (err, results, fields) => {
                if (err) {
                    return console.error(err.message);
                }
            });
        }

        if (command === 'get') {
            let userid = message.author.id
            let getFtnlink = `SELECT * FROM ftnlink WHERE userid=?`;
            connection.query(getFtnlink, [userid], (error, results, fields) => {
                if (error) {
                    return console.error(error.message);
                }
                message.channel.send(`Username = ${results[0].username}, platform = ${results[0].platform}`)
                console.log(results[0].username);
                console.log(results[0].platform);
            });

        }
    })
});

// Login to Discord 
client.login(config.token);