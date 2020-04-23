const Discord = require('discord.js');
const config = require("./config.json");
var dbCreds = require('./dbCreds.js');
var lowerCase = require('lower-case');
var gameRooms = require('./gameRooms.js');
const databaseCheck = require('./databaseBuilder.js');
// const fs = require("fs");
// var check = require('check-types');
// const express = require('express');
const bot = new Discord.Client();
const PREFIX = config.prefix;
const {
    Pool
} = require('pg');
const pool = new Pool(dbCreds);

// var diceActivePlayer = "<:aa:693193020866297886><:cr:693193020572565527><:tt:693193021373546528><:ii:693193021100916836><:vv:693193021319282798><:er:693193020870492246>  <:pp:693193021260300288><:lr:693193021360963664><:aa:693193020866297886><:yy:693193021516415017><:er:693193020870492246><:rr:693193020958310462>";

// Ready statement
bot.on('ready', () => {
    console.log(`${GetTimeStamp()} :: GorillaBot is ready to serve on ${bot.guilds.cache.size} servers, for ${bot.users.cache.size} users.`)
    bot.user.setActivity("Gorilla Marketing", {
        type: "Playing"
    }); //TODO - get status working
    databaseCheck.createDatabaseTablesIfNotExist;
});

// error catch-all
bot.on("error", (e) => console.error(`${GetTimeStamp()} :: ${e}`));
bot.on("warn", (e) => console.warn(`${GetTimeStamp()} :: ${e}`));
bot.on("debug", (e) => console.info(`${GetTimeStamp()} :: ${e}`));

// Link to God data
bot.diceData = require("./diceData.json");

// JOIN ME ONLINE Interval check
setInterval(function () {
    // console.log("running removeTempOnlineRole at " + GetTimeStamp());
    // updateStatus()  
}, 3000); // 86400000 = 1day, 3600000 = 1hr, 60000 = 1min

// Main Args/Response 
bot.on('message', (message) => {
    if (!message.author.bot) {
        // console.log(message)
        if (message.channel.type === "dm") {
            dmArchive(message);
            titleTaglineFromPlayer(message);
        } else {
            messageArchive(message)
        }
    }

    if (!message.content.startsWith(PREFIX) || message.author.bot) {
        return;
    }

    let args = message.content.substring(PREFIX.length).split(/ +/g);
    // console.log ("args = " + args);
    // console.log(`${message.author.username} ${message.author.discriminator} id = ${message.author.id} looked up ${args} #${godArray.indexOf(lowerCase(args[0]))} - ${GetTimeStamp()}`);

    args[0] = lowerCase(args[0]);
    switch (args[0]) {

        case 'emojis':
            const emojiList = message.guild.emojis.cache.map((e, x) => (x + ' = ' + e) + ' | ' + e.name).join('\n');
            message.channel.send(emojiList);
            break;

        case 'eval':
            if (message.author.id !== config.ownerID) return;
            const args = message.content.split(" ").slice(1);
            try {
                const code = args.join(" ");
                let evaled = eval(code);

                if (typeof evaled !== "string")
                    evaled = require("util").inspect(evaled);

                message.channel.send(clean(evaled), {
                    code: "xl"
                });
            } catch (err) {
                message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
            }
            break;

        case 'reset':
            if (message.channel.type === "dm") {
                message.author.send(`That command doesn't work in direct messages.`)
            } else {
                resetTable(message);
            }
            break;

        case 'roll':
        case '🦍':
        case '🎲':
            if (message.channel.type === "dm") {
                message.channel.send(rollDice());
            } else {
                if (message.member.voice.channel != null) {
                    let textChannelIndex = gameRooms.textChannels.indexOf(message.channel.name);
                    let voiceChannelIndex = gameRooms.voiceChannels.indexOf(message.member.voice.channel.name);
                    if (gameRooms.textChannels.indexOf(message.channel.name) >= 0 && gameRooms.textChannels.indexOf(message.channel.name) <= gameRooms.textChannels.length && textChannelIndex === voiceChannelIndex) {
                        if (message.member.voice.channel.members.size >= 2) { //TODO update to 3 upon deploy
                            let gameIsActive = getGameId(message).then((x => console.log(`returned from .then is: ${x}`)));

                            if (gameIsActive != null || gameIsActive == undefined) {
                                console.log(`inside case roll - roll_for_game - gameIsActive = ${gameIsActive}`);
                                roll_for_game(message);
                            } else {
                                console.log(`inside case roll - rollDice - gameIsActive = ${gameIsActive}`);
                                message.channel.send(rollDice());
                            }
                        } else {
                            message.channel.send(rollDice());
                        }
                    } else {
                        message.channel.send(rollDice());
                    }
                } else {
                    message.channel.send(rollDice());
                }
            }
            break;

        case 'start':
            if (message.channel.type === "dm") {
                message.author.send(`That command doesn't work in direct messages.`)
            } else {
                if (message.member.voice.channel != null) {
                    let textChannelIndex = gameRooms.textChannels.indexOf(message.channel.name);
                    let voiceChannelIndex = gameRooms.voiceChannels.indexOf(message.member.voice.channel.name);
                    if (gameRooms.textChannels.indexOf(message.channel.name) >= 0 && gameRooms.textChannels.indexOf(message.channel.name) <= gameRooms.textChannels.length && textChannelIndex === voiceChannelIndex) {
                        if (message.member.voice.channel.members.size >= 2) { //TODO update to 3 upon deploy
                            console.log(message.member.voice.channel.parent.name, message.member.voice.channel.parent.id);
                            message.member.voice.channel.parent.children.forEach(function (channel_id) {
                                console.log(channel_id.name, channel_id.id);
                            });

                            (async () => {
                                var gameIsActive = await gameIsInProgress(message);
                                console.log(`anon immediate async = ${gameIsActive}`)
                                return gameIsActive;
                            })();

                            // // (async () => {
                            //     var gameIsActive = gameIsInProgress(message);
                            //     console.log(`anon immediate async = ${gameIsActive}`)
                            //     // return gameIsActive;
                            // // })();


                            // ;
                            // (async () => {
                            //     const {
                            //         rows
                            //     } = await pool.query('SELECT game_id FROM public.games WHERE category_id = $1 AND game_is_active = true', [message.channel.parent.id])
                            //     console.log('new code - game_id:', rows[0])
                            // })().catch(err =>
                            //     setImmediate(() => {
                            //         throw err
                            //     })
                            // )
                        } else {
                            message.channel.send(`To start a game, there must be at least 3 players using the text and voice channels from the same game room.`);
                            console.log(`!START FAILED: Not enough players`);
                        }
                    } else {
                        message.channel.send(`To start a game, there must be at least 3 players using the text and voice channels from the same game room.`);
                        console.log(`!START FAILED: Not using a game room text channel`);
                    }
                } else {
                    message.channel.send(`To start a game, there must be at least 3 players using the text and voice channels from the same game room.`);
                    console.log(`!START FAILED: Not in a voice channel`);
                }
            }
            break;
    }
});

function clean(text) {
    if (typeof (text) === "string") {
        console.log(`clean() input`);
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    } else {
        console.log(`returned input without cleaning`);
        return text;
    }
}

function dmAnswerFromPlayer() {
    // if message came from a member in a current game, log it in the database
    // if all players in that game have sent their answer post them to the channel as individual messages
    // when one of the messages gets an emoji, send the player's name to the channel and add a point tho that player's score.
}

function emoji(id) {
    return bot.emojis.cache.get(id).toString();
}

async function gameIsInProgress(message) {
    ;
    (async () => {
        const client = await pool.connect()
        try {
            let gameIsActive = Boolean;
            const query = await client.query(`SELECT * FROM public.games WHERE category_id = ${message.member.voice.channel.parent.id} AND game_is_active = true ORDER BY message_timestamp DESC LIMIT 1`)
            query.rows.forEach(row => {
                console.log(`game_id = ${row.game_id}, category_name = ${row.category_name}, game_is_active = ${row.game_is_active}`);
                gameIsActive = row.game_is_active;
            })
            if (gameIsActive == true) {
                message.channel.send(`There is already a game in progress at this table.`);
            } else {
                startGame(message);
            }
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack))
}

// function gameIsInProgress(message) {
//     const client = pool.connect()
//     let gameIsActive = Boolean;
//     const query = client.query(`SELECT * FROM public.games WHERE category_id = ${message.member.voice.channel.parent.id} AND game_is_active = true ORDER BY message_timestamp DESC LIMIT 1`)
//     query.rows.forEach(row => {
//         console.log(`game_id = ${row.game_id}, category_name = ${row.category_name}, game_is_active = ${row.game_is_active}`);
//         gameIsActive = row.game_is_active;
//     })
//     client.release()
//     if (gameIsActive == true) {
//         message.channel.send(`There is already a game in progress at this table.`);
//         return gameIsActive;
//     } else {
//         startGame(message);
//         return gameIsActive;
//     }
// }

async function getGameId(message) {
    // ;
    // (async () => {
    const client = await pool.connect()
    try {
        // let game_id = "";
        const query = await client.query({
            rowMode: 'array',
            text: `SELECT game_id FROM public.games WHERE category_id = ${message.member.voice.channel.parent.id} AND game_is_active = true ORDER BY message_timestamp DESC LIMIT 1;`
        })
        console.log(query.fields[0].name)
        await query.rows.forEach(row => {
            console.log(`getGame_Id row.game_id = ${row.game_id}`);
            // return row.game_id;
            return (row.game_id);
        })
    } catch (e) {
        console.log(e.stack)
        throw e
    } finally {
        client.release()
    }
    // })().catch(err => console.log(err.stack))
}

function GetTimeStamp() {
    let now = new Date();
    return "[" + now.toLocaleString() + "]";
}

async function resetTable(message) {
    ;
    (async () => {
        const client = await pool.connect()
        try {
            const query = await client.query(`SELECT * FROM public.games WHERE category_id = ${message.channel.parent.id} AND game_is_active = true`)
            query.rows.forEach(row => {
                client.query(`UPDATE public.games SET game_is_active = false WHERE game_id = ${row.game_id}`)
                client.query(`UPDATE public.turns SET game_is_active = false WHERE game_session_id = ${row.game_id}`)
                client.query(`UPDATE public.turns SET turn_is_active = false WHERE game_session_id = ${row.game_id}`)
            })
            message.channel.send(`The ${message.channel.parent.name} is ready for a new game. Use !start to begin.`)
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            // Make sure to release the client before any error handling,
            // just in case the error handling itself throws an error.
            client.release()
        }
    })().catch(err => console.log(err.stack))
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
            if (blankFace < 2) {
                var nextDice = bot.diceData[diceId[i]].sides[diceSide[0]].emoji;
                diceString = diceString.concat(`${nextDice} `);
                var nextEmoji = emoji(bot.diceData[diceId[i]].sides[diceSide[0]].emojiId);
                diceEmoji = diceEmoji.concat(`${nextEmoji} `);
                diceCount += 1;
                redCount += bot.diceData[diceId[i]].sides[diceSide[0]].color_value;
            } else {
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

function roll_for_game(message) {
    message.channel.send(`${message.member}: **ACTIVE PLAYER**`);
    message.member.voice.channel.members.forEach(function (guildMember, guildMemberId) {
        console.log(guildMemberId, guildMember.user.username);
        if (message.member.id != guildMemberId) {
            let playersDice = rollDice();
            // message.channel.send(`<@${guildMemberId}>: ||${playersDice}||`);
            guildMember.send(`${playersDice}`);;
            (async () => {
                const client = await pool.connect()
                try {
                    const query = await client.query(`SELECT game_id FROM public.games WHERE category_id = ${message.member.voice.channel.parent.id} AND game_is_active = true ORDER BY message_timestamp DESC LIMIT 1`)
                    query.rows.forEach(row => {
                        game_id = row.game_id;
                    })
                    const prepStmnt = {
                        'game_session_id': game_id,
                        'game_is_active': true,
                        'turn_is_active': true,
                        'readable_timestamp': GetTimeStamp(),
                        'message_timestamp': message.createdTimestamp,
                        'category_name': message.member.voice.channel.parent.name,
                        'category_id': message.member.voice.channel.parent.id,
                        'text_channel_id': message.channel.id,
                        'voice_channel_id': message.member.voice.channel.id,
                        'message_id': message.id,
                        'active_player_id': message.member.id,
                        'active_player_username': message.author.username,
                        'player_id': guildMemberId,
                        'player_username': guildMember.user.username,
                        'letters_given': playersDice,
                        'title_tagline': "requested",
                        'title_tagline_is_submitted': false,
                        'point_earned': 0,
                    }
                    await client.query('BEGIN')
                    const prepStmntKeys = 'INSERT INTO public.turns(game_session_id, game_is_active, turn_is_active, readable_timestamp, message_timestamp, category_name, category_id, text_channel_id, voice_channel_id, message_id, active_player_id, active_player_username, player_id, player_username, letters_given, title_tagline, title_tagline_is_submitted, point_earned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)'
                    const prepStmntValues = [prepStmnt.game_session_id, prepStmnt.game_is_active, prepStmnt.turn_is_active, prepStmnt.readable_timestamp, prepStmnt.message_timestamp, prepStmnt.category_name, prepStmnt.category_id, prepStmnt.text_channel_id, prepStmnt.voice_channel_id, prepStmnt.message_id, prepStmnt.active_player_id, prepStmnt.active_player_username, prepStmnt.player_id, prepStmnt.player_username, prepStmnt.letters_given, prepStmnt.title_tagline, prepStmnt.title_tagline_is_submitted, prepStmnt.point_earned]
                    await client.query(prepStmntKeys, prepStmntValues)
                    await client.query('COMMIT')
                    console.log(`after commit returned game_id = ${game_id}`);
                } catch (e) {
                    await client.query('ROLLBACK')
                    throw e
                } finally {
                    client.release()
                }
            })().catch(err => console.log(err.stack))
        }
    });
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

async function startGame(message) {
    ;
    (async () => {
        const client = await pool.connect()
        try {
            const prepGameStart = {
                'game_is_active': true,
                'readable_timestamp': GetTimeStamp(),
                'message_timestamp': message.createdTimestamp,
                'guild_name': message.guild.name,
                'guild_id': message.guild.id,
                'category_name': message.member.voice.channel.parent.name,
                'category_id': message.member.voice.channel.parent.id,
                'text_channel_id': message.channel.id,
                'voice_channel_id': message.member.voice.channel.id,
                'message_id': message.id,
                'author_id': message.author.id,
                'author_username': message.author.username
            }
            await client.query('BEGIN')
            const insertGameStartText = 'INSERT INTO public.games(game_is_active, readable_timestamp, message_timestamp, guild_name, guild_id, category_name, category_id, text_channel_id, voice_channel_id, message_id, author_id, author_username) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)'
            const insertGameStartValues = [prepGameStart.game_is_active, prepGameStart.readable_timestamp, prepGameStart.message_timestamp, prepGameStart.guild_name, prepGameStart.guild_id, prepGameStart.category_name, prepGameStart.category_id, prepGameStart.text_channel_id, prepGameStart.voice_channel_id, prepGameStart.message_id, prepGameStart.author_id, prepGameStart.author_username]
            await client.query(insertGameStartText, insertGameStartValues)
            await client.query('COMMIT')
            message.channel.send(`Starting Gorilla Marketing.`);
            message.channel.send(`TODO: add rules and bot instructions.`);
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack))
}

async function titleTaglineFromPlayer(message) {
    // console.log(`INSIDE titleTaglineFromPlayer function`);
    ;
    (async () => {
        const client = await pool.connect()
        try {
            let titleTagline = clean(message.content);
            console.log(`${message.author.username} sent ${titleTagline}`);
            client.query(`UPDATE public.turns SET title_tagline = $$${titleTagline}$$ WHERE player_id = ${message.author.id} AND title_tagline_is_submitted = false AND turn_is_active = true And message_timestamp = (SELECT MAX(message_timestamp) from public.turns);`)
            client.query(`UPDATE public.turns SET title_tagline_is_submitted = true WHERE player_id = ${message.author.id} AND title_tagline_is_submitted = false;`)
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    })().catch(err => console.log(err.stack))
}

async function updateStatus() {
    var statusArray = [
        "Barrel of Monkeys",
        "Donkey Kong",
        "Donkey Kong Country",
        "Diddy Kong Racing",
        "Donkey Kong Barrel Blast",
        "Mario Kart",
        "Gorilla Marketing",
        "GRASS: Bananaham",
        "Donkey Kong Jr.",
        "Zooloretto: The Gorilla",
        "Banana Blast",
        "Cheeky Monkey",
        "Monkey Madness",
        "Go Ape!"
    ];
    shuffle(statusArray);
    console.log(statusArray[0]);
    var test = await (bot.user.setActivity("Gorilla Marketing", {
        type: "Playing"
    }));
    console.log(`test = ${Promise.resolve(test)}`);
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