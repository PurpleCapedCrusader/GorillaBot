const Discord = require('discord.js');
// const express = require('express');
const config = require("./config.json");
var dbCreds = require('./dbCreds.js');
var lowerCase = require('lower-case');
var check = require('check-types');
const databaseCheck = require('./databaseBuilder.js');
// const fs = require("fs");
const bot = new Discord.Client();
const PREFIX = config.prefix;
const {
    Pool
} = require('pg');
const pool = new Pool(dbCreds);

var diceActivePlayer = "<:aa:693193020866297886><:cr:693193020572565527><:tt:693193021373546528><:ii:693193021100916836><:vv:693193021319282798><:er:693193020870492246>  <:pp:693193021260300288><:lr:693193021360963664><:aa:693193020866297886><:yy:693193021516415017><:er:693193020870492246><:rr:693193020958310462>";

// Ready statement
bot.on('ready', () => {
    console.log(`${GetTimeStamp()} :: GorillaBot is ready to serve on ${bot.guilds.cache.size} servers, for ${bot.users.cache.size} users.`)
    bot.user.setActivity("Gorilla Marketing", {
        type: "Playing"
    });
    databaseCheck.createDatabaseTablesIfNotExist;
});

// error catch-all
bot.on("error", (e) => console.error(`${GetTimeStamp()} :: ${e}`));
bot.on("warn", (e) => console.warn(`${GetTimeStamp()} :: ${e}`));
bot.on("debug", (e) => console.info(`${GetTimeStamp()} :: ${e}`));

// Link to God data
bot.diceData = require("./diceData.json");

// Main Args/Response 
bot.on('message', (message) => {
    if (!message.author.bot) {
        // console.log(message)
        // if (message.channel.type === "dm") {
        //     dmArchive(message)
        // } else {
        //     messageArchive(message)
        // }
    }

    if (!message.content.startsWith(PREFIX) || message.author.bot) {
        return;
    }

    // Add Online Role and remove after a time
    if (message.content.slice(0, 7).toLowerCase() === '!online') {
        if (message.channel.name === 'gorilla-bot') {
            const args = message.content.slice(PREFIX.length).toLowerCase().trim().split(/ +/g);
            var roleRequested = "Join Me Online";
            // var roleRequested_id = config.online_role_id;
            var durationRequested = Number(args[1]);
            if ((check.integer(Number(durationRequested))) && (check.between(Number(durationRequested), 0, 61))) {
                setTempOnlineRole(durationRequested, message, roleRequested)
            } else {
                message.channel.send(`${args[1]} is not a valid input. You must use a number between 1 and 60. "!online 15" means you're avaialble to play online for the next 15 minutes.`)
                return;
            }
        } else {
            message.channel.send(`That command only works in the #gorilla-bot channel.`)
        }
    };

    let args = message.content.substring(PREFIX.length).split(/ +/g);
    // console.log ("args = " + args);
    // console.log(`${message.author.username} ${message.author.discriminator} id = ${message.author.id} looked up ${args} #${godArray.indexOf(lowerCase(args[0]))} - ${GetTimeStamp()}`);

    args[0] = lowerCase(args[0]);
    switch (args[0]) {

        case 'emojis':
            const emojiList = message.guild.emojis.cache.map((e, x) => (x + ' = ' + e) + ' | ' + e.name).join('\n');
            message.channel.send(emojiList);
            break;

        case 'roll':
        case '🦍':
        case'🎲':
            console.log(`message.member.voice.channel = ${message.member.voice.channel}`)
            if (message.member.voice.channel != null) {
                console.log(`message.member.voice.channel.members.size = ${message.member.voice.channel.members.size}`)
                if (message.member.voice.channel.members.size > 1) {
                    message.channel.send(`${message.member}: **ACTIVE PLAYER**`);
                    message.member.voice.channel.members.forEach(function (guildMember, guildMemberId) {
                        console.log(guildMemberId, guildMember.user.username);
                        if (message.member.id != guildMemberId) {
                            let playersDice = rollDice();
                            message.channel.send(`<@${guildMemberId}>: ${playersDice}`);
                            // guildMember.send(`${playersDice}`);
                        }
                    })
                } else {
                    message.channel.send(`This isn't a solo game... you'll need more players.`);
                }
            } else {
                message.channel.send(rollDice());
            }
            break;

        case 'reset':
            resetTable();
            break;
    }
});

function resetTable() {
    // !setgameroom by admin updates game room database and sets channel as a game room 
    // if last message in a game room is older than 10 minutes, post game/bot guide


}

function rollDice() {
    var diceId = [0, 1, 2, 3, 4, 5, 6, 7];
    var diceSide = [0, 1, 2, 3, 4, 5];
    var redCount = 0;
    var diceCount = 0;
    var diceString = "";
    var diceEmoji = "";
    var blankFace = 0;
    shuffle(diceId);
    for (var i = 0; i < diceId.length; i++) {
        if (redCount < 2 && diceCount < 4) {
            shuffle(diceSide);
            blankFace += bot.diceData[diceId[i]].sides[diceSide[0]].blank;
            // console.log(JSON.stringify(bot.diceData[diceId[i]].sides[diceSide[0]].emoji));
            if (blankFace < 2) {
                var nextDice = bot.diceData[diceId[i]].sides[diceSide[0]].emoji;
                diceString = diceString.concat(`${nextDice} `);
                var nextEmoji = emoji(bot.diceData[diceId[i]].sides[diceSide[0]].emojiId);
                diceEmoji = diceEmoji.concat(`${nextEmoji} `);
                diceCount += 1;
                redCount += bot.diceData[diceId[i]].sides[diceSide[0]].color_value;
                // console.log(`diceString = ${diceString}`);
                // console.log(`diceString = ${diceEmoji}`);
                // console.log(`diceCount = ${diceCount}`);
                // console.log(`redCount = ${redCount}`);
            } else {
                // console.log(`DOUBLE BLANKS`);
                i = 0;
                redCount = 0;
                diceCount = 0;
                diceString = "";
                diceEmoji = "";
                blankFace = 0;
            }
        }
    }
    return (diceEmoji);
}

function GetTimeStamp() {
    let now = new Date();
    return "[" + now.toLocaleString() + "]";
}

function emoji(id) {
    return bot.emojis.cache.get(id).toString();
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

async function messageArchive(message) {
    ;
    (async () => {
        const client = await pool.connect()
        try {
            const prepMessageArchive = {
                'readable_timestamp': GetTimeStamp(),
                'guild_name': message.guild.name,
                'guild_id': message.guild.id,
                'channel_name': message.channel.name,
                'channel_id': message.channel.id,
                'message_id': message.id,
                'author_id': message.author.id,
                'author_username': message.author.username,
                'member_nickname': message.member.nickname,
                'message_timestamp': message.createdTimestamp,
                'message_content': message.mentions._content
            }
            await client.query('BEGIN')
            const insertMessageArchiveText = 'INSERT INTO public.message_archive(readable_timestamp, guild_name, guild_id, channel_name, channel_id, message_id, author_id, author_username, member_nickname, message_timestamp, message_content) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)'
            const insertMessageArchiveValues = [prepMessageArchive.readable_timestamp, prepMessageArchive.guild_name, prepMessageArchive.guild_id, prepMessageArchive.channel_name, prepMessageArchive.channel_id, prepMessageArchive.message_id, prepMessageArchive.author_id, prepMessageArchive.author_username, prepMessageArchive.member_nickname, prepMessageArchive.message_timestamp, prepMessageArchive.message_content]
            await client.query(insertMessageArchiveText, insertMessageArchiveValues)
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack))
}

async function dmArchive(message) {
    ;
    (async () => {
        const client = await pool.connect()
        try {
            const prepDmArchive = {
                'readable_timestamp': GetTimeStamp(),
                'author_username': message.author.username,
                'author_id': message.author.id,
                'message_timestamp': message.createdTimestamp,
                'message_content': message.content
            }
            await client.query('BEGIN')
            const insertDmArchiveText = 'INSERT INTO public.dm_archive(readable_timestamp, author_username, author_id, message_timestamp, message_content) VALUES ($1, $2, $3, $4, $5)'
            const insertDmArchiveValues = [prepDmArchive.readable_timestamp, prepDmArchive.author_username, prepDmArchive.author_id, prepDmArchive.message_timestamp, prepDmArchive.message_content]
            await client.query(insertDmArchiveText, insertDmArchiveValues)
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack))
}
// Super Secret Token!!!
bot.login(config.token);