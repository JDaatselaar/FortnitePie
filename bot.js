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
// Fortnite
let replacement = /@/gi


// When bot is up and running
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    getFortniteUpdate()
    setInterval(getFortniteUpdate, 300000);
});

// Login in to the Fortnite API
fortniteAPI.login().then(() => {

    // On Message
    client.on('message', (message) => {
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        // CPU Reduction
        if (!message.content.startsWith(config.prefix) || message.author.bot) {
            return
        } 

        // Fortnite Command

        if (command === 'ftn') {
            let sub = args[0]
            let subsub = args[1]
            // Link username and platform to userid
            if (sub === 'link') {
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
                // Checks if user exists
                let userid = message.author.id
                let getFtnlink = `SELECT * FROM ftnlink WHERE userid=?`;
                connection.query(getFtnlink, [userid], (error, results, fields) => {
                    if (results.length == 0) {
                        if (!args[2]) {
                            let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("Please provide a platform")
                            .setColor(errColor)
                            return message.channel.send(embed)
                        } else if (!subsub) {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Error")
                                .setDescription("Please provide a username")
                                .setColor(errColor)
                                return message.channel.send(embed)
                            } else if (!((args[2] === 'pc') || (args[2] === 'xbox') || (args[2] === 'ps4'))) {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Error")
                                .setDescription("Please provide a valid platform")
                                .setColor(errColor)
                            return message.channel.send(embed)
                        }
                        let linkPlatform = args[2]

                        if (linkPlatform === 'xbox') {
                            linkPlatform = 'xb1'
                        }
                        let linkName = subsub
                        
                        let ftnInsert = `INSERT INTO ftnlink(userid, username, platform) VALUES(?,?,?)`;
                        let insertment = [userid, linkName, linkPlatform];
                        // Execute Insert
                        connection.query(ftnInsert, insertment, (err, results, fields) => {
                            if (err) {
                                return console.error(err.message);
                            }
                        });

                        let embed = new Discord.RichEmbed()
                            .setTitle("Fortnite")
                            .setDescription("Succesfully linked your account")
                            .setColor(ftnColor)
                        return message.channel.send(embed)
                    } else {
                        message.channel.send(`You are already linked to \`${results[0].username}\`, please unlink first`)
                    }
                    if (error) {
                        return console.error(error.message);
                    }
                });


            } else if (sub === 'unlink') {
                let userid = message.author.id
                let deletion = `DELETE FROM ftnlink WHERE userid = ?`;

                connection.query(deletion, userid, (error, results, fields) => {
                    if (error)
                        return console.error(error.message);
                });

                let embed = new Discord.RichEmbed()
                    .setTitle("Fortnite")
                    .setDescription("Succesfully unlinked your account")
                    .setColor(ftnColor)
                return message.channel.send(embed)
            } else if (sub === 'status') {
                fortniteAPI
                    .checkFortniteStatus()
                    .then(status => {
                        if (status === true) {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Fortnite Status")
                                .setDescription("The Fortnite Servers are up and running")
                                .setColor(ftnColor)
                            message.channel.send(embed)
                        } else if (status === false) {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Fortnite Status")
                                .setDescription("The Fortnite Servers are currently down")
                                .setColor(ftnColor);
                        }
                    })
                    .catch(err => {
                        console.log(err)
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("An unknown error occurred")
                            .setColor(errColor)
                        return message.channel.send(embed)

                    });
            } else if (sub === 'news') {
                fortniteAPI
                    .getFortniteNews("en")
                    .then(news => {
                        if (news.br.length === '0') {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Fortnite")
                                .setDescription("There are no news items to show")
                                .setColor("ftnColor");
                            return message.channel.send(embed)
                        } else {
                            for (let i = 0; i < news.br.length; i++) {
                                let outnews = new Discord.RichEmbed()
                                    .setAuthor("Fortnite News")
                                    .setTitle(news.br[i].title)
                                    .setDescription(news.br[i].body)
                                    .setImage(news.br[i].image)
                                    .setColor(ftnColor);

                                message.channel.send(outnews);
                            }
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("An unknown error occurred")
                            .setColor(errColor)
                        return message.channel.send(embed)
                    });
            } else if (sub === 'twitter') {
                if (subsub === 'on') {
                    let perms = message.member.permissions.has("MANAGE_CHANNELS")

                    if (!perms) {
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("You do not have the proper permission to use this command")
                            .setColor(errColor)
                        return message.channel.send(embed)
                    }

                    let getTwitlink = `SELECT * FROM twitlink WHERE serverid=?`;
                    connection.query(getTwitlink, message.channel.guild.id, (error, results, fields) => {
                        if (error) {
                            return console.error(error.message);
                        }
                        if (results.length == 0) {
                            let twitInsert = `INSERT INTO twitlink(serverid, channelid) VALUES(?,?)`;
                            let insertment = [message.channel.guild.id, message.channel.id];
                            // Execute Insert
                            connection.query(twitInsert, insertment, (err, results, fields) => {
                                if (err) {
                                    return console.error(err.message);
                                }
                            });
                            let embed = new Discord.RichEmbed()
                                .setTitle("Fortnite")
                                .setDescription("Succesfully linked this channel as twitterchannel")
                                .setColor(ftnColor)
                            return message.channel.send(embed)
                        } else {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Error")
                                .setDescription("Your server is already linked, please unlink first")
                                .setColor(errColor)
                            return message.channel.send(embed)
                        }
                        console.log(results)
                    });
                } else if (subsub === 'off') {
                    let perms = message.member.permissions.has("MANAGE_CHANNELS")

                    if (!perms) {
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("You do not have the proper permission to use this command")
                            .setColor(errColor)
                        return message.channel.send(embed)
                    }
                    let deletion = `DELETE FROM twitlink WHERE serverid = ?`;

                    connection.query(deletion, message.channel.guild.id, (error, results, fields) => {
                        if (error)
                            return console.error(error.message);
                            let embed = new Discord.RichEmbed()
                                .setTitle("Fortnite")
                                .setDescription("Succesfully unlinked this channel")
                                .setColor(ftnColor)
                            return message.channel.send(embed)
                    });
                }

            } else {
                if ((!message.mentions.members.first()) && (!sub)) {
                    let userid = message.author.id
                    let getFtnlink = `SELECT * FROM ftnlink WHERE userid=?`;
                    connection.query(getFtnlink, [userid], (error, results, fields) => {
                        if (results.length == 0) {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Error")
                                .setDescription("You haven't linked your account")
                                .setColor(errColor)
                            return message.channel.send(embed)
                        } else {
                            let username = results[0].username.replace(replacement, '')
                            let platform = results[0].platform.replace(replacement, '')
                            console.log(username, platform)

                            fortniteAPI
                                .getStatsBR(username, platform, "alltime")
                                .then(stats => {
                                    let embed = new Discord.RichEmbed()
                                        .setTitle("Fortnite Stats")
                                        .setDescription(`The Fortnite Stats of ${username} on ${platform.toUpperCase()}`)
                                        .setColor(ftnColor)
                                        .addField("Name", username, true)
                                        .addField("Matches", stats.lifetimeStats.matches, true)
                                        .addField("Kills", stats.lifetimeStats.kills, true)
                                        .addField("Wins", stats.lifetimeStats.wins, true)
                                        .addField("Win%", `${Math.round(((stats.lifetimeStats.wins / stats.lifetimeStats.matches) * 100) * 100) / 100}%`, true)
                                        .addField("K/D", Math.round((stats.lifetimeStats.kills / (stats.lifetimeStats.matches - stats.lifetimeStats.wins)) * 100) / 100, true);
                                    message.channel.send(embed)
                                })
                                .catch(err => {
                                    console.log(err)
                                    let embed = new Discord.RichEmbed()
                                        .setTitle("Error")
                                        .setDescription("An unknown error occurred")
                                        .setColor(errColor)
                                    return message.channel.send(embed)
                                });
                        }
                        if (error) {
                            return console.error(error.message);
                        }
                    });
                } else if (message.mentions.members.first()) {
                    let userid = message.mentions.members.first().id
                    let getFtnlink = `SELECT * FROM ftnlink WHERE userid=?`;
                    connection.query(getFtnlink, [userid], (error, results, fields) => {
                        if (results.length == 0) {
                            let embed = new Discord.RichEmbed()
                                .setTitle("Error")
                                .setDescription("This user doesn't have a linked account")
                                .setColor(errColor)
                            return message.channel.send(embed)
                        } else {
                            let username = results[0].username.replace(replacement, '')
                            let platform = results[0].platform.replace(replacement, '')
                            // message.channel.send(`Username: ${username}, Platform: ${platform}`)
                            console.log(username, platform)

                            fortniteAPI
                                .getStatsBR(username, platform, "alltime")
                                .then(stats => {
                                    let embed = new Discord.RichEmbed()
                                        .setTitle("Fortnite Stats")
                                        .setDescription(`The Fortnite Stats of ${username} on ${platform.toUpperCase()}`)
                                        .setColor(ftnColor)
                                        .addField("Name", username, true)
                                        .addField("Matches", stats.lifetimeStats.matches, true)
                                        .addField("Kills", stats.lifetimeStats.kills, true)
                                        .addField("Wins", stats.lifetimeStats.wins, true)
                                        .addField("Win%", `${Math.round(((stats.lifetimeStats.wins / stats.lifetimeStats.matches) * 100) * 100) / 100}%`, true)
                                        .addField("K/D", Math.round((stats.lifetimeStats.kills / (stats.lifetimeStats.matches - stats.lifetimeStats.wins)) * 100) / 100, true);
                                    message.channel.send(embed)
                                })
                                .catch(err => {
                                    console.log(err)
                                    let embed = new Discord.RichEmbed()
                                        .setTitle("Error")
                                        .setDescription("An unknown error occurred")
                                        .setColor(errColor)
                                    return message.channel.send(embed)
                                });
                        }
                        if (error) {
                            return console.error(error.message);
                        }
                    });
                } else {
                    let username = sub.replace(replacement, '')
                    if (!args[1]) {
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("Please provide a platform")
                            .setColor(errColor)
                        return message.channel.send(embed)
                    } else if (!sub) {
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("Please provide a username")
                            .setColor(errColor)
                        return message.channel.send(embed)
                    } 
                    
                    let platform = args[1]
                    if (!((platform === 'pc') || (platform === 'xbox') || (platform === 'ps4'))) {
                        let embed = new Discord.RichEmbed()
                            .setTitle("Error")
                            .setDescription("Please provide a valid platform")
                            .setColor(errColor)
                        return message.channel.send(embed)
                    }

                    if (platform === 'xbox') {
                        platform = 'xb1'
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
                                .addField("Matches", stats.lifetimeStats.matches, true)
                                .addField("Kills", stats.lifetimeStats.kills, true)
                                .addField("Wins", stats.lifetimeStats.wins, true)
                                .addField("Win%", `${Math.round(((stats.lifetimeStats.wins / stats.lifetimeStats.matches) * 100) * 100) / 100}%`, true)
                                .addField("K/D", Math.round((stats.lifetimeStats.kills / (stats.lifetimeStats.matches - stats.lifetimeStats.wins)) * 100) / 100, true);
                            message.channel.send(embed)
                        })
                        .catch(err => {
                            console.log(err)
                            let embed = new Discord.RichEmbed()
                                .setTitle("Error")
                                .setDescription("An unknown error occurred")
                                .setColor(errColor)
                            return message.channel.send(embed)
                        });
                }
            }

        }

    })
});

function getFortniteUpdate() {
    console.log("Checking for twitter updates...");
    twitClient.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
            // Check if the tweet is new
            if (tweets[0].id_str !== id_str) {
                id_str = tweets[0].id_str;
                let name = '@' + tweets[0].user.screen_name;
                let text = tweets[0].text;
                let picture = tweets[0].user.profile_image_url_https;
                onFortniteTweet(name, text, picture)
            }
        } else {
            console.log(error);
        }
    });
}



// When a tweet is send
function onFortniteTweet(displayName, content, profilePicture) {
    embed = new Discord.RichEmbed()
        .setTitle(displayName)
        .setDescription(content)
        .setColor("#00aced")
        .setThumbnail(profilePicture);
    console.log("Checking Tweets");

    let createTwitlink = `create table if not exists twitlink(
                          serverid varchar(255) not null,
                          channelid varchar(255)not null
                      )`;
    connection.query(createTwitlink, function (err, results, fields) {
        if (err) {
            console.log(err.message);
        }
    });

    let getTwitlink = `SELECT * FROM twitlink`;
    connection.query(getTwitlink, (error, results, fields) => {
        if (error) {
            return console.error(error.message);
        }
        if (results.length == 0) {
            return console.log('twitlink results are 0')
        } else {
            for (let i = 0; i < results.length; i++) {
                if (client.channels.has(results[i].channelid)) {
                    client.channels.get(results[i].channelid).send(embed)
                }
                // console.log(results[i])
            }
        }
        // console.log(results)
    });


}

client.on('guildCreate', (guild) => {
    let embed = new Discord.RichEmbed()
    .setTitle("FortniteGamer")
    .setDescription(`Thanks for adding FortniteGamer to ${guild.name}. You can find a list of all commands at https://github.com/jvdaa/FortniteGamer#readme. Arguments <> with a * are required. If you ever have any problems regarding FortniteGamer, please contact \`vandaatselaarj@gmail.com\`. Have a great time using FortniteGamer! `)
    .setColor(ftnColor);
    guild.owner.send(embed)
})

// Login to Discord 
client.login(config.token);