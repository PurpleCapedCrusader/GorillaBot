const Discord = require("discord.js");
const config = require("./config.json");
var dbCreds = require("./dbCreds.js");
var lowerCase = require("lower-case");
var gameRooms = require("./gameRooms.js");
const databaseCheck = require("./databaseBuilder.js");
var _ = require('lodash');
// const fs = require("fs");
// var check = require("check-types");
// const express = require("express");
const bot = new Discord.Client();
const PREFIX = config.prefix;
const {
    Pool
} = require("pg");
const pool = new Pool(dbCreds);

bot.on("ready", () => {
    console.log(
        `${getTimeStamp()} :: GorillaBot is ready to serve on ${
      bot.guilds.cache.size
    } servers, for ${bot.users.cache.size} users.`
    );
    bot.user.setActivity("Gorilla Marketing", {
        type: "Playing",
    }); //TODO: get status working
    databaseCheck.createDatabaseTablesIfNotExist;
});

// error catch-all
bot.on("error", (e) => console.error(`${getTimeStamp()} :: ${e}`));
bot.on("warn", (e) => console.warn(`${getTimeStamp()} :: ${e}`));
bot.on("debug", (e) => console.info(`${getTimeStamp()} :: ${e}`));

// Link to game data
bot.diceData = require("./diceData.json");
bot.leafletData = require("./leafletData.json");

// setInterval(function () {
//     // TODO: reset active game with no members in voice channel

//     // console.log("running removeTempOnlineRole at " + GetTimeStamp());
//     // updateStatus()
// }, 3000); // 86400000 = 1day, 3600000 = 1hr, 60000 = 1min

// Main Args/Response
bot.on("message", (message) => {
    if (!message.author.bot) {
        // console.log(message)
        if (message.channel.type === "dm") {
            dmArchive(message);
            if (!message.content.startsWith(PREFIX) || message.author.bot) {
                titleTaglineFromPlayer(message);
            }
        } else {
            messageArchive(message);
        }
    }

    if (!message.content.startsWith(PREFIX) || message.author.bot) {
        return;
    }

    let args = message.content.substring(PREFIX.length).split(/ +/g);
    // console.log ("args = " + args);
    console.log(
        `${message.author.username} ${message.author.discriminator} id = ${
      message.author.id
    } looked up ${args} - ${getTimeStamp()}`
    );

    args[0] = lowerCase(args[0]);
    switch (args[0]) {
        // case "add":
        //     // TODO: !add @username - adds player to game
        // break;

        // case "change":
        //     // TODO: update current turn with a new title or tagline submission
        // break;

        case "lodash":
            playerInActiveGame(message);
            break;

        case "emojis":
            const emojiList = message.guild.emojis.cache
                .map((e, x) => x + " = " + e + " | " + e.name)
                .join("\n");
            message.channel.send(emojiList);
            break;

        case "eval":
            if (message.author.id !== config.ownerID) return;
            const args = message.content.split(" ").slice(1);
            try {
                const code = args.join(" ");
                let evaled = eval(code);

                if (typeof evaled !== "string")
                    evaled = require("util").inspect(evaled);

                message.channel.send(clean(evaled), {
                    code: "xl",
                });
            } catch (err) {
                message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
            }
            break;

            // case "remove":
            //     // TODO: !remove @username - removes player from game
            // break;

        case "play":
        case "start":
        case "begin":
            if (message.channel.type === "dm") {
                message.author.send(`That command doesn't work in direct messages.`);
            } else {
                message.channel.send(`Use the **!Bands**, **!College Courses**, **!Companies**, ` +
                    `**!Food Trucks**, **!Movies**, **!Organizations**, or ` +
                    `**!Products** command to start a game.`);
            }
            break;

        case "reset":
            if (message.channel.type === "dm") {
                message.author.send(`That command doesn't work in direct messages.`);
            } else {
                getGameId(message).then((results) => {
                    gameId = results;
                    if (gameId != false) {
                        resetTable(gameId);
                    }
                });
            }
            break;

        case "roll":
        case "🦍":
        case "🎲":
            if (message.channel.type === "dm") {
                message.channel.send(rollDice());
            } else {
                if (message.member.voice.channel != null) {
                    let textChannelIndex = gameRooms.textChannels.indexOf(
                        message.channel.name
                    );
                    // TODO: pull player list from public.leaflet
                    let voiceChannelIndex = gameRooms.voiceChannels.indexOf(
                        message.member.voice.channel.name
                    );
                    if (
                        gameRooms.textChannels.indexOf(message.channel.name) >= 0 &&
                        gameRooms.textChannels.indexOf(message.channel.name) <=
                        gameRooms.textChannels.length &&
                        textChannelIndex === voiceChannelIndex
                    ) {
                        if (message.member.voice.channel.members.size >= 2) {
                            //TODO: update to 3 upon deploy
                            playerTurnsTaken(message)
                                .then((results) => {
                                    turnsTaken = results;
                                    console.log(
                                        `inside case roll -> playerTurnsTaken() -> turnsTaken = ${turnsTaken}`
                                    );
                                    if (turnsTaken >= 2) {
                                        message.channel.send(
                                            `${message.member}: You've already been the Active Player twice.`
                                        );
                                        return;
                                    } else if (turnsTaken < 2) {
                                        gameIsInProgress(message).then((results) => {
                                            gameIs = results;
                                            console.log(
                                                `inside case roll -> gameIsInProgress() -> gameIs = ${gameIs}`
                                            );
                                            if (gameIs == "true") {
                                                turnIsInProgress(message).then((results) => {
                                                    turnIs = results;
                                                    console.log(
                                                        `inside case roll -> turnIsInProgress() -> turnIs = ${turnIs}`
                                                    );
                                                    if (turnIs == true) {
                                                        message.channel.send(
                                                            `The Active Player must use a reaction emoji on the winning title or tagline before the next player can !roll.`
                                                        );
                                                    } else {
                                                        endTurn(message).then(roll_for_game(message));
                                                    }
                                                });
                                            } else {
                                                message.channel.send(
                                                    `Once all players are in the voice channel, use the **!Bands**, **!College Courses**, **!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or **!Products** command to start a game.`
                                                );
                                            }
                                        });
                                    }
                                })
                                .catch((err) => console.error(err));
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

        case "score":
        case "🍌":
            if (message.channel.type === "dm") {
                message.author.send(`That command doesn't work in direct messages.`);
            } else {
                (async () => {
                    const client = await pool.connect();
                    try {
                        const gameSessionId = await client.query({
                            rowMode: "array",
                            text: `SELECT game_session_id ` +
                                `FROM public.turns ` +
                                `WHERE text_channel_id = ${message.channel.id} ` +
                                `AND turn_is_active = true ` +
                                `ORDER BY message_timestamp DESC LIMIT 1;`,
                        });
                        if (gameSessionId.rows.length != 0) {
                            score(gameSessionId.rows);
                        } else {
                            message.channel.send(`There is no score yet.`);
                            return;
                        }
                    } catch (e) {
                        throw e;
                    } finally {
                        client.release();
                    }
                })().catch((err) => console.log(err.stack));
            }
            break;

        case "movies":
        case "bands":
        case "products":
        case "companies":
        case "food":
        case "college":
        case "organizations":
            if (message.channel.type === "dm") {
                message.author.send(`That command doesn't work in direct messages.`);
            } else {
                if (message.member.voice.channel != null) {
                    // TODO: don't allow players to be in more than 1 active game
                    let textChannelIndex = gameRooms.textChannels.indexOf(message.channel.name);
                    let voiceChannelIndex = gameRooms.voiceChannels.indexOf(message.member.voice.channel.name);
                    if (
                        gameRooms.textChannels.indexOf(message.channel.name) >= 0 &&
                        gameRooms.textChannels.indexOf(message.channel.name) <=
                        gameRooms.textChannels.length &&
                        textChannelIndex === voiceChannelIndex
                    ) {
                        if (message.member.voice.channel.members.size >= 2) { //TODO: update to 3 upon deploy
                            console.log(
                                message.member.voice.channel.parent.name,
                                message.member.voice.channel.parent.id
                            );
                            message.member.voice.channel.parent.children.forEach(function (channel_id) {
                                console.log(channel_id.name, channel_id.id);
                            });
                            gameIsInProgress(message)
                                .then((results) => {
                                    gameIs = results;
                                    console.log(`inside case roll -> gameIsInProgress() -> gameIs = ${gameIs}` );
                                    if (gameIs == "true") {
                                        message.channel.send(
                                            `This table is in use. Please choose ` +
                                            `a different table or use the **!reset** ` +
                                            `command to close the current game.`
                                        );
                                    } else {
                                        playerInActiveGame(message)
                                            .then((results) => {
                                                playerInGame = results;
                                                console.log(`playerInGame = ${playerInGame}`);
                                                if (playerInGame == "true") {
                                                    return;
                                                } else if (playerInGame == "false") {
                                                    startGame(message);
                                                }
                                            })
                                            .catch((err) => console.error(err));
                                    }
                                })
                                .catch((err) => console.error(err));
                        } else {
                            message.channel.send(
                                `To start a game, there must be at least 3 players using ` +
                                `the text and voice channels from the same game room.`
                            );
                            console.log(`START FAILED: Not enough players`);
                        }
                    } else {
                        message.channel.send(
                            `To start a game, there must be at least 3 players using the ` +
                            `text and voice channels from the same game room.`
                        );
                        console.log(`START FAILED: Not using a game room text channel`);
                    }
                } else {
                    message.channel.send(
                        `To start a game, there must be at least 3 players using the text ` +
                        `and voice channels from the same game room.`
                    );
                    console.log(`START FAILED: Not in a voice channel`);
                }
            }
            break;

            // case "word":
            //     //TODO: use Datamuse https://api.datamuse.com/words?ml=MOVIES&sp=LETTER*&max=100
            //     //TODO: replace THEME with a random word that is related to the category or theme
            //     break;
    }
});

bot.on("messageReactionAdd", async (reaction, user) => {
    // When we receive a reaction we check if the reaction is partial or not
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        console.log("messageReactionAdd Partial");
        try {
            await reaction.fetch();
        } catch (error) {
            console.log("Something went wrong when fetching the message: ", error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    console.log(`reaction.message.content = ${reaction.message.content}`);
    console.log(`reaction.message.channel.id = ${reaction.message.channel.id}`);
    console.log(`reaction.message.channel.type = ${reaction.message.channel.type}`);
    console.log(`user.id = ${user.id}`);

    const client = await pool.connect();
    try {
        if (reaction.message.channel.type == "dm") {
            const turnIsActive = await client.query({
                rowMode: "array",
                text: `SELECT turn_is_active ` +
                    `FROM public.turns ` +
                    `WHERE active_player_id = ${user.id} ` +
                    `AND game_is_active = true ` +
                    `ORDER BY message_timestamp DESC LIMIT 1;`,
            });
            const turnAsActivePlayer = await client.query({
                rowMode: "array",
                text: `SELECT turns_as_active_player ` +
                    `FROM public.game_leaflet ` +
                    `WHERE player_id = ${user.id} ` +
                    `AND game_is_active = true ` +
                    `ORDER BY game_leaflet_id DESC LIMIT 1;`,
            });
            const gameSessionID = await client.query({
                rowMode: "array",
                text: `SELECT game_session_id ` +
                    `FROM public.game_leaflet ` +
                    `WHERE player_id = ${user.id} ` +
                    `AND game_is_active = true ` +
                    `ORDER BY game_leaflet_id DESC LIMIT 1`,
            });
            console.log(`pre turnAsActivePlayer = ${turnAsActivePlayer.rows}`);
            console.log(`turnIsActive.rows = ${turnIsActive.rows}`);
            if (turnIsActive.rows == "true") {
                if (turnAsActivePlayer.rows == 1) {
                    console.log(`turnAsActivePlayer = ${turnAsActivePlayer.rows}`);
                    await client.query(
                        `UPDATE public.game_leaflet` +
                        `SET title_judge_choice = $$${reaction.message.content}$$ ` +
                        `WHERE player_id = ${user.id} ` +
                        `AND game_is_active = true;`);
                }
                if (turnAsActivePlayer.rows == 2) {
                    console.log(`turnAsActivePlayer = ${turnAsActivePlayer.rows}`);
                    await client.query(
                        `UPDATE public.game_leaflet ` +
                        `SET tagline_judge_choice = $$${reaction.message.content}$$ ` +
                        `WHERE player_id = ${user.id} ` +
                        `AND game_is_active = true;`);
                }
            }
            await sendToTextChannel(gameSessionID.rows);
        }
        if (reaction.message.channel.type != "dm") {
            const pointAlreadyGiven = await client.query(
                `SELECT point_earned ` +
                `FROM public.turns ` +
                `WHERE active_player_id = ${user.id} ` +
                `AND text_channel_id = ${reaction.message.channel.id} ` +
                `AND turn_is_active = true`);
            await pointAlreadyGiven.rows.forEach((row) => {
                if (row.point_earned == 1) {
                    reaction.remove();
                    reaction.message.channel.send(
                        `**The Active Player may only add 1 reaction emoji** \n\u200b` +
                        `The Active Player's reaction emoji is used as a banana (1 point). ` +
                        `To change who gets the banana, the reaction must be removed before another is added.`
                    );
                    return;
                }
            });
            const activePlayerId = await client.query({
                rowMode: "array",
                text: `SELECT active_player_id ` +
                    `FROM public.turns ` +
                    `WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
                    `AND turn_is_active = true ` +
                    `ORDER BY message_timestamp DESC LIMIT 1;`,
            });
            const turnWinnerData = await client.query(
                `SELECT * FROM public.turns ` +
                `WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
                `AND turn_is_active = true ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`);
            turnWinnerData.rows.forEach((row) => {
                gameSessionId = row.game_session_id;
                playerId = row.player_id;
            });
            if (activePlayerId.rows == user.id) {
                await client.query(
                    `UPDATE public.turns ` +
                    `SET point_earned = 1 ` +
                    `WHERE active_player_id = ${user.id} ` +
                    `AND dice_and_tagline = $$${reaction.message.content}$$ ` +
                    `AND point_earned = 0;`);
                const total_points = await client.query({
                    rowMode: "array",
                    text: `SELECT total_points ` +
                        `FROM public.game_leaflet ` +
                        `WHERE game_session_id = ${gameSessionId} ` +
                        `AND player_id = ${playerId};`,
                });
                let playerPoints = parseInt(total_points.rows);
                playerPoints += 1;
                await client.query(
                    `UPDATE public.game_leaflet ` +
                    `SET total_points = ${playerPoints} ` +
                    `WHERE game_session_id = ${gameSessionId} ` +
                    `AND player_id = ${playerId}`);

                const turnWinnerData = await client.query(
                    `SELECT * ` +
                    `FROM public.turns ` +
                    `WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
                    `AND turn_is_active = true ` +
                    `ORDER BY message_timestamp DESC LIMIT 1;`);
                turnWinnerData.rows.forEach((row) => {
                    gameSessionId = row.game_session_id;
                    playerId = row.player_id;
                    textChannelId = row.text_channel_id;
                });
                const total_players = await client.query({
                    rowMode: "array",
                    text: `SELECT game_leaflet_id ` +
                        `FROM public.game_leaflet ` +
                        `WHERE game_session_id = ${gameSessionId};`,
                });
                const twoTurns = await client.query({
                    rowMode: "array",
                    text: `SELECT game_leaflet_id ` +
                        `FROM public.game_leaflet ` +
                        `WHERE game_session_id = ${gameSessionId} ` +
                        `AND turns_as_active_player = 2;`,
                });
                console.log(`total_players.rows.length = ${total_players.rows.length}`);
                console.log(`twoTurns.rows.length = ${twoTurns.rows.length}`);
                console.log(`gameSessionId = ${gameSessionId}`);
                if (total_players.rows.length != twoTurns.rows.length) {
                    bot.channels.fetch(`${textChannelId}`).then((results) => {
                        gameChannel = results;
                        gameChannel.send(
                            `\n\u200b\n\u200bReady for next player to **!roll**`
                        );
                    });
                }
                if (total_players.rows.length === twoTurns.rows.length) {
                    bot.channels
                        .fetch(`${textChannelId}`)
                        .then((results) => {
                            gameChannel = results;
                            gameChannel.send(`\n\u200b\n\u200b**Final Score:**`);
                        })
                        .then(score(gameSessionId))
                        .then(resetTable(gameSessionId))
                }
            }
        }
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
});

bot.on("messageReactionRemove", async (reaction, user) => {
    // When we receive a reaction we check if the reaction is partial or not
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        try {
            await reaction.fetch();
        } catch (error) {
            console.log("Something went wrong when fetching the message: ", error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    console.log(`reaction.message.content = ${reaction.message.content}`);
    console.log(`reaction.message.channel.id = ${reaction.message.channel.id}`);
    const client = await pool.connect();
    try {
        const activePlayerId = await client.query({
            rowMode: "array",
            text: `SELECT active_player_id ` +
                `FROM public.turns ` +
                `WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
                `AND turn_is_active = true ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        if (activePlayerId.rows == user.id) {
            await client.query(
                `UPDATE public.turns ` +
                `SET point_earned = 0 ` +
                `WHERE active_player_id = ${user.id} ` +
                `AND dice_and_tagline = $$${reaction.message.content}$$ ` +
                `AND point_earned = 1;`);
        }
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
});

function clean(text) {
    if (typeof text === "string") {
        console.log(`clean() input`);
        return text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203));
    } else {
        console.log(`returned input without cleaning`);
        return text;
    }
}

function emoji(id) {
    return bot.emojis.cache.get(id).toString();
}

async function endTurn(message) {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE public.turns \n
            SET turn_is_active = false \n
            WHERE text_channel_id = ${message.channel.id};`);
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}

async function getGameId(message) {
    const client = await pool.connect();
    try {
        const gameId = await client.query({
            rowMode: "array",
            text: `SELECT game_id ` +
                `FROM public.games ` +
                `WHERE text_channel_id = ${message.channel.id} ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        if (gameId.rows.length === 0) {
            return false;
        } else {
            return gameId.rows;
        }
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}

async function gameIsInProgress(message) {
    const client = await pool.connect();
    const result = await client.query({
        rowMode: "array",
        text: `SELECT game_is_active ` +
            `FROM public.games ` +
            `WHERE category_id = ${message.member.voice.channel.parent.id} ` +
            `ORDER BY message_timestamp DESC LIMIT 1`,
    });
    await client.release();
    console.log(`gameIsInProgres result.rows = ${result.rows}`);
    if (result.rows.length === 0) {
        return false;
    } else {
        return result.rows;
    }
}

function getTimeStamp() {
    let now = new Date();
    return "[" + now.toLocaleString() + "]";
}

async function playerInActiveGame(message) {
    const client = await pool.connect();
    try {
        const playersInActiveGames = await client.query(
            `SELECT player_id ` +
            `FROM public.game_leaflet ` +
            `WHERE game_is_active = true;`,
        );
        var playersInActiveGamesArray = [];
        playersInActiveGames.rows.forEach((row) => {
            playersInActiveGamesArray.push(row.player_id);
        });
        var playersInThisChannel = [];
        message.member.voice.channel.members.forEach(function(guildmember) {
            playersInThisChannel.push(guildmember.id);
        });
        var intersection = _.intersection(playersInThisChannel,playersInActiveGamesArray);
        console.log(`Players trying to join 2 games at the same time = ${intersection}`);
        if (intersection.length === 0) {
            return "false";
        } else {
            message.channel.send(`${intersection} are currently in another game.`);
            return "true";
        }
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}

async function playerTurnsTaken(message) {
    const client = await pool.connect();
    try {
        const numberOfTurns = await client.query({
            rowMode: "array",
            text: `SELECT turns_as_active_player ` +
                `FROM public.game_leaflet ` +
                `WHERE player_id = ${message.member.id} ` +
                `AND text_channel_id = ${message.channel.id} ` +
                `AND game_is_active = true;`,
        });
        return numberOfTurns.rows;
    } catch (e) {
        throw e;
    } finally {
        client.release();
    }
}

async function resetTable(gameId) {
    // change to accept gameId
    const client = await pool.connect();
    try {
        // const query = await client.query(`SELECT * FROM public.games WHERE category_id = ${message.channel.parent.id} AND game_is_active = true`)
        // query.rows.forEach(row => {
        const textChannelId = await client.query({
            rowMode: "array",
            text: `SELECT text_channel_id ` +
                `FROM public.games ` +
                `WHERE game_id = ${gameId} ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        client.query(`UPDATE public.games SET game_is_active = false WHERE game_id = ${gameId}`);
        client.query(`UPDATE public.turns SET game_is_active = false WHERE game_session_id = ${gameId}`);
        client.query(`UPDATE public.turns SET turn_is_active = false WHERE game_session_id = ${gameId}`);
        client.query(`UPDATE public.turns SET title_tagline_is_submitted = true WHERE game_session_id = ${gameId}`);
        client.query(`UPDATE public.game_leaflet SET game_is_active = false WHERE game_session_id = ${gameId}`);
        // })
        bot.channels.fetch(`${textChannelId.rows}`).then((results) => {
            gameChannel = results;
            gameChannel.send(`\n\u200b\n\u200bType **!Bands**, **!College Courses**, ` +
                `**!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or ` +
                `**!Products** to choose your theme.`);
        });
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
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
                var nextEmoji = emoji(
                    bot.diceData[diceId[i]].sides[diceSide[0]].emojiId
                );
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
    return diceEmoji;
}

function roll_for_game(message) {
    (async () => {
        const client = await pool.connect();
        try {
            const gameLeafletData = await client.query(
                `SELECT * ` +
                `FROM public.game_leaflet ` +
                `WHERE player_id = ${message.member.id} ` +
                `AND game_is_active = true`
            );
            gameLeafletData.rows.forEach((row) => {
                gameSessionId = row.game_session_id;
                gameIsActive = row.game_is_active;
                turnsAsActivePlayer = row.turns_as_active_player;
                themeCategory = row.theme_category_roll;
                titleJudge = row.title_judge_roll;
                taglineJudge = row.tagline_judge_roll;
            });
            let winningTitle;
            console.log(`turnsAsActivePlayer = ${turnsAsActivePlayer}`);
            if (turnsAsActivePlayer >= 2) {
                message.channel.send(
                    `${message.member}: You've already been the Active Player twice.`
                );
                return;
            }
            if (turnsAsActivePlayer == 0) {
                turnsAsActivePlayer += 1;
                await client.query(
                    `UPDATE public.game_leaflet ` +
                    `SET turns_as_active_player = 1 ` +
                    `WHERE player_id = ${message.member.id} ` +
                    `AND game_is_active = true;`
                );
            } else if (turnsAsActivePlayer == 1) {
                turnsAsActivePlayer += 1;
                await client.query(
                    `UPDATE public.game_leaflet ` +
                    `SET turns_as_active_player = 2 ` +
                    `WHERE player_id = ${message.member.id} ` +
                    `AND game_is_active = true;`
                );
                const roundOneWinner = await client.query({
                    rowMode: "array",
                    text: `SELECT title_tagline ` +
                        `FROM public.turns ` +
                        `WHERE active_player_id = ${message.member.id} ` +
                        `AND game_is_active = true ` +
                        `AND point_earned = 1 ` +
                        `ORDER BY message_timestamp DESC LIMIT 1;`,
                });
                winningTitle = roundOneWinner.rows;
            }
            const gameTheme = await client.query({
                rowMode: "array",
                text: `SELECT game_theme ` +
                    `FROM public.games ` +
                    `WHERE category_id = ${message.member.voice.channel.parent.id} ` +
                    `AND game_is_active = true ` +
                    `ORDER BY message_timestamp DESC LIMIT 1;`, //TODO: make this more simple
            });
            let gameThemeRows = gameTheme.rows;
            let themeCategoryText =
                bot.leafletData[gameThemeRows]["category"][themeCategory];
            let titleJudge1 = bot.leafletData[gameThemeRows]["judge1"][titleJudge];
            let titleJudge2 = bot.leafletData[gameThemeRows]["judge2"][titleJudge];
            let taglineJudge1 = bot.leafletData["round2"]["r2j1"][taglineJudge];
            let taglineJudge2 = bot.leafletData["round2"]["r2j2"][taglineJudge];
            message.channel.send(`${gameThemeRows}: **${themeCategoryText}**`);
            if (turnsAsActivePlayer == 2) {
                message.channel.send(`Winning Title: **${winningTitle}**`);
            }
            message.channel.send(`${message.member}: **ACTIVE PLAYER**`);

            // TODO: check public.game_leaflet for users in game instead of voice channel
            message.member.voice.channel.members.forEach(function (
                guildMember,
                guildMemberId
            ) {
                if (message.member.id == guildMemberId) {
                    guildMember.send(
                        `**Add a reaction to the award you choose to give.**`
                    );
                    if (turnsAsActivePlayer == 1) {
                        guildMember.send(`${titleJudge1}`);
                        guildMember.send(`${titleJudge2}`);
                    }
                    if (turnsAsActivePlayer == 2) {
                        guildMember.send(`${taglineJudge1}`);
                        guildMember.send(`${taglineJudge2}`);
                    }
                }
            });
            //TODO: get list of players from public.game_leaflet instead of members in voice channel
            message.member.voice.channel.members.forEach(function (
                guildMember,
                guildMemberId
            ) {
                console.log(guildMemberId, guildMember.user.username);
                if (message.member.id != guildMemberId) {
                    let playersDice = rollDice();
                    guildMember.send(`${gameThemeRows}: **${themeCategoryText}**`);
                    if (turnsAsActivePlayer == 2) {
                        guildMember.send(`Winning Title: **${winningTitle}**`);
                    }
                    guildMember.send(`${playersDice}`);
                    (async () => {
                        const client = await pool.connect();
                        try {
                            const gameId = await client.query({
                                rowMode: "array",
                                text: `SELECT game_id ` +
                                    `FROM public.games ` +
                                    `WHERE category_id = ${message.member.voice.channel.parent.id} ` +
                                    `AND game_is_active = true ` +
                                    `ORDER BY message_timestamp DESC LIMIT 1;`,
                            });
                            const gameTheme = await client.query({
                                rowMode: "array",
                                text: `SELECT game_theme ` +
                                    `FROM public.games ` +
                                    `WHERE category_id = ${message.member.voice.channel.parent.id} ` +
                                    `AND game_is_active = true ` +
                                    `ORDER BY message_timestamp DESC LIMIT 1;`,
                            });
                            console.log(`gameTheme.rows = ${gameTheme.rows}`);
                            const prepStmnt = {
                                game_session_id: parseInt(gameId.rows),
                                game_is_active: true,
                                turn_is_active: true,
                                readable_timestamp: getTimeStamp(),
                                message_timestamp: message.createdTimestamp,
                                category_name: message.member.voice.channel.parent.name,
                                category_id: message.member.voice.channel.parent.id,
                                text_channel_id: message.channel.id,
                                voice_channel_id: message.member.voice.channel.id,
                                message_id: message.id,
                                game_theme: gameTheme.rows.toString(),
                                active_player_id: message.member.id,
                                active_player_username: message.author.username,
                                player_id: guildMemberId,
                                player_username: guildMember.user.username,
                                letters_given: playersDice,
                                title_tagline: null,
                                title_tagline_is_submitted: false,
                                point_earned: 0,
                            };
                            await client.query("BEGIN");
                            const prepStmntKeys =
                                `INSERT INTO public.turns(game_session_id, game_is_active, ` +
                                `turn_is_active, readable_timestamp, message_timestamp, ` +
                                `category_name, category_id, text_channel_id, voice_channel_id, ` +
                                `message_id, game_theme, active_player_id, active_player_username, ` +
                                `player_id, player_username, letters_given, title_tagline, ` +
                                `title_tagline_is_submitted, point_earned) ` +
                                `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`;
                            const prepStmntValues = [
                                prepStmnt.game_session_id,
                                prepStmnt.game_is_active,
                                prepStmnt.turn_is_active,
                                prepStmnt.readable_timestamp,
                                prepStmnt.message_timestamp,
                                prepStmnt.category_name,
                                prepStmnt.category_id,
                                prepStmnt.text_channel_id,
                                prepStmnt.voice_channel_id,
                                prepStmnt.message_id,
                                prepStmnt.game_theme,
                                prepStmnt.active_player_id,
                                prepStmnt.active_player_username,
                                prepStmnt.player_id,
                                prepStmnt.player_username,
                                prepStmnt.letters_given,
                                prepStmnt.title_tagline,
                                prepStmnt.title_tagline_is_submitted,
                                prepStmnt.point_earned,
                            ];
                            await client.query(prepStmntKeys, prepStmntValues);
                            await client.query("COMMIT");
                        } catch (e) {
                            await client.query("ROLLBACK");
                            throw e;
                        } finally {
                            client.release();
                        }
                    })().catch((err) => console.log(err.stack));
                }
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    })().catch((err) => console.log(err.stack));
}

function score(gameId) {
    (async () => {
        const client = await pool.connect();
        const gameLeafletData = await client.query(
            `SELECT * ` +
            `FROM public.game_leaflet ` +
            `WHERE game_session_id = ${gameId};`
        ); // AND game_is_active = true
        if (gameLeafletData.rows.length == 0) {
            bot.channels.fetch(`${row.text_channel_id}`).then((results) => {
                let bananaScore = "";
                if (row.total_points === 0) {
                    bananaScore = "<:blank:693193020455125094> ";
                }
                for (var i = 1; i <= row.total_points; i++) {
                    bananaScore = bananaScore.concat(":banana:");
                }
                gameChannel = results;
                gameChannel.send(`<@${row.player_id}>: ${bananaScore}`);
            });
        }
        gameLeafletData.rows.forEach((row) => {
            bot.channels.fetch(`${row.text_channel_id}`).then((results) => {
                let bananaScore = "";
                if (row.total_points === 0) {
                    bananaScore = "<:blank:693193020455125094> ";
                }
                for (var i = 1; i <= row.total_points; i++) {
                    bananaScore = bananaScore.concat(":banana:");
                }
                gameChannel = results;
                gameChannel.send(`<@${row.player_id}>: ${bananaScore}`);
            });
        });
        // gameChannel.send(`\n\u200b\n\u200b`);
    })().catch((err) => console.log(err.stack));
}

async function sendToTextChannel(gameSessionID) {
    const client = await pool.connect();
    try {
        const playerCount = await client.query({
            rowMode: "array",
            text: `SELECT turns_id ` +
                `FROM public.turns ` +
                `WHERE game_session_id = ${gameSessionID} ` +
                `AND turn_is_active = true`,
        });
        console.log(`playerCount = ${playerCount.rows}`)
        console.log(`playerCount length = ${playerCount.rows.length}`)
        const activePlayer = await client.query({
            rowMode: "array",
            text: `SELECT active_player_id ` +
                `FROM public.turns WHERE game_session_id = ${gameSessionID} ` +
                `AND turn_is_active = true ` +
                `ORDER BY message_timestamp DESC LIMIT 1`,
        });
        const taglineCount = await client.query({
            rowMode: "array",
            text: `SELECT turns_id ` +
                `FROM public.turns ` +
                `WHERE game_session_id = ${gameSessionID} ` +
                `AND turn_is_active = true ` +
                `AND title_tagline_is_submitted = true`,
        });
        const gameLeafletData = await client.query(
            `SELECT * ` +
            `FROM public.game_leaflet ` +
            `WHERE player_id = ${activePlayer.rows} ` +
            `AND game_session_id = ${gameSessionID}`
        );
        gameLeafletData.rows.forEach((row) => {
            turnsAsActivePlayer = row.turns_as_active_player;
            titleJudge = row.title_judge_choice;
            taglineJudge = row.tagline_judge_choice;
            textChannelId = row.text_channel_id;
        });
        var awardChoice;
        console.log(`turnsAsActivePlayer = ${turnsAsActivePlayer}`);
        console.log(`titleJudge = ${titleJudge}`);
        console.log(`taglineJudge = ${taglineJudge}`);
        console.log(`textChannelId = ${textChannelId}`);
        if (turnsAsActivePlayer == 1) {
            awardChoice = titleJudge;
        }
        if (turnsAsActivePlayer == 2) {
            awardChoice = taglineJudge;
        }
        if (awardChoice != null) {
            if (playerCount.rows.length == taglineCount.rows.length) {
                bot.channels
                    .fetch(`${textChannelId}`)
                    .then((results) => {
                        textChannel = results;
                        console.log(`textChannel = ${textChannel}`);
                        textChannel.send(`Award: **${awardChoice}**`);
                    })
                    .catch((err) => console.error(err));
                const allTaglines = await client.query(
                    `SELECT * ` +
                    `FROM public.turns ` +
                    `WHERE game_session_id = ${gameSessionID} ` +
                    `AND turn_is_active = true ` +
                    `ORDER BY RANDOM()`);
                allTaglines.rows.forEach((row) => {
                    bot.channels
                        .fetch(`${row.text_channel_id}`)
                        .then((results) => {
                            gameChannel = results;
                            console.log(`gameChannel = ${gameChannel}`);
                            gameChannel.send(`${row.letters_given}: ${row.title_tagline}`);
                        })
                        .catch((err) => console.error(err));
                });
            }
        }
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;
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
    let theme = themeFormat(message);
    const client = await pool.connect();
    try {
        // TODO: check if people in voice channel are already in another active game

        const prepGameStart = {
            game_is_active: true,
            readable_timestamp: getTimeStamp(),
            message_timestamp: message.createdTimestamp,
            guild_name: message.guild.name,
            guild_id: message.guild.id,
            category_name: message.member.voice.channel.parent.name,
            category_id: message.member.voice.channel.parent.id,
            text_channel_id: message.channel.id,
            voice_channel_id: message.member.voice.channel.id,
            message_id: message.id,
            game_theme: theme,
            author_id: message.author.id,
            author_username: message.author.username,
        };
        await client.query("BEGIN");
        const insertGameStartText =
            `INSERT INTO public.games(game_is_active, readable_timestamp, message_timestamp, ` +
            `guild_name, guild_id, category_name, category_id, text_channel_id, ` +
            `voice_channel_id, message_id, game_theme, author_id, author_username) ` +
            `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
        const insertGameStartValues = [
            prepGameStart.game_is_active,
            prepGameStart.readable_timestamp,
            prepGameStart.message_timestamp,
            prepGameStart.guild_name,
            prepGameStart.guild_id,
            prepGameStart.category_name,
            prepGameStart.category_id,
            prepGameStart.text_channel_id,
            prepGameStart.voice_channel_id,
            prepGameStart.message_id,
            prepGameStart.game_theme,
            prepGameStart.author_id,
            prepGameStart.author_username,
        ];
        await client.query(insertGameStartText, insertGameStartValues);
        await client.query("COMMIT");

        const gameId = await client.query({
            rowMode: "array",
            text: `SELECT game_id ` +
                `FROM public.games ` +
                `WHERE category_id = ${message.member.voice.channel.parent.id} ` +
                `AND game_is_active = true ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        let themeCategoryRoll = shuffle(Array.from(Array(27).keys()));
        let titleJudgeRoll = shuffle(Array.from(Array(27).keys()));
        let taglineJudgeRoll = shuffle(Array.from(Array(27).keys()));
        let i = 0;
        message.member.voice.channel.members.forEach(function (guildmember) {
            (async () => {
                const prepGameLeaflet = {
                    game_session_id: parseInt(gameId.rows),
                    game_is_active: true,
                    player_id: guildmember.id,
                    turns_as_active_player: 0,
                    theme_category_roll: themeCategoryRoll[i],
                    title_judge_roll: titleJudgeRoll[i],
                    title_judge_choice: null,
                    tagline_judge_roll: taglineJudgeRoll[i],
                    tagline_judge_choice: null,
                    total_points: 0,
                    category_id: message.member.voice.channel.parent.id,
                    text_channel_id: message.channel.id,
                    voice_channel_id: message.member.voice.channel.id,
                };
                await client.query("BEGIN");
                const insertGameLeafletText =
                    `INSERT INTO public.game_leaflet(game_session_id, game_is_active, player_id, ` +
                    `turns_as_active_player, theme_category_roll, title_judge_roll, ` +
                    `title_judge_choice, tagline_judge_roll, tagline_judge_choice, ` +
                    `total_points, category_id, text_channel_id, voice_channel_id ) ` +
                    `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
                const insertGameLeafletValues = [
                    prepGameLeaflet.game_session_id,
                    prepGameLeaflet.game_is_active,
                    prepGameLeaflet.player_id,
                    prepGameLeaflet.turns_as_active_player,
                    prepGameLeaflet.theme_category_roll,
                    prepGameLeaflet.title_judge_roll,
                    prepGameLeaflet.title_judge_choice,
                    prepGameLeaflet.tagline_judge_roll,
                    prepGameLeaflet.tagline_judge_choice,
                    prepGameLeaflet.total_points,
                    prepGameLeaflet.category_id,
                    prepGameLeaflet.text_channel_id,
                    prepGameLeaflet.voice_channel_id,
                ];
                await client.query(insertGameLeafletText, insertGameLeafletValues);
                await client.query("COMMIT");
            })().catch((err) => console.log(err.stack));
            i += 1;
        });
        message.channel.send(`**Starting Gorilla Marketing**`);
        message.channel.send(
            `**1**. **!roll** - Sets Active Player and starts turn.\n\u200b` +
            `**2**. All players go to GorillaBot DM.\n\u200b` +
            `   - Active Player: add a reaction emoji to the award you want to give.\n\u200b` +
            `   - Players: respond with your title or tagline.\n\u200b` +
            `**3**. All players come back to this game table.\n\u200b` +
            `**4**. Active Player: add a reaction emoji to the best title or tagline.\n\u200b` +
            `**5**. Repeat and have fun!!!\n\u200b\n\u200b` +
            `Commands:\n\u200b` +
            `  **!reset** - clears the table for a new game.\n\u200b` +
            `  **!score** - displays current scores.\n\u200b\ `
        );
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

function themeFormat(message) {
    let theme = lowerCase(message.content).substring(PREFIX.length).split(/ +/g);
    let themeCapitalized = theme[0].charAt(0).toUpperCase() + theme[0].slice(1);
    if (themeCapitalized == "Food") {
        themeCapitalized = "Food Trucks";
    }
    if (themeCapitalized == "College") {
        themeCapitalized = "College Courses";
    }
    return themeCapitalized;
}

async function titleTaglineFromPlayer(message) {
    const client = await pool.connect();
    try {
        //  Checking for tagline already submitted
        const titleTaglineIsSubmitted = await client.query({
            rowMode: "array",
            text: `SELECT title_tagline_is_submitted ` +
                `FROM public.turns ` +
                `WHERE player_id = ${message.author.id} ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        if (titleTaglineIsSubmitted.rows == "true") {
            return;
        }
        let titleTagline = clean(message.content);
        console.log(`${message.author.username} sent ${titleTagline}`);
        await client.query(
            `UPDATE public.turns ` +
            `SET title_tagline = $$${titleTagline}$$ ` +
            `WHERE player_id = ${message.author.id} ` +
            `AND turn_is_active = true ` +
            `AND message_timestamp = (SELECT MAX(message_timestamp) from public.turns);`);
        const lettersGiven = await client.query({
            rowMode: "array",
            text: `SELECT letters_given ` +
                `FROM public.turns ` +
                `WHERE title_tagline = $$${titleTagline}$$ ` +
                `AND turn_is_active = true LIMIT 1;`,
        });
        await client.query(
            `UPDATE public.turns ` +
            `SET dice_and_tagline = $$${lettersGiven.rows}: ${titleTagline}$$ ` +
            `WHERE player_id = ${message.author.id} ` +
            `AND turn_is_active = true ` +
            `AND message_timestamp = (SELECT MAX(message_timestamp) from public.turns);`);
        await client.query(
            `UPDATE public.turns ` +
            `SET title_tagline_is_submitted = true ` +
            `WHERE player_id = ${message.author.id} ` +
            `AND title_tagline_is_submitted = false;`);
        const gameSessionID = await client.query({
            rowMode: "array",
            text: `SELECT game_session_id ` +
                `FROM public.turns ` +
                `WHERE title_tagline = $$${titleTagline}$$ ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        await sendToTextChannel(gameSessionID.rows);
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

async function turnIsInProgress(message) {
    const client = await pool.connect();
    try {
        const gameId = await client.query({
            rowMode: "array",
            text: `SELECT game_id ` +
                `FROM public.games ` +
                `WHERE category_id = ${message.member.voice.channel.parent.id} ` +
                `AND game_is_active = true ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        let activeGameId = gameId.rows;
        const gameIdInTurns = await client.query({
            rowMode: "array",
            text: `SELECT game_session_id ` +
                `FROM public.turns ` +
                `WHERE game_session_id = ${activeGameId} ` +
                `ORDER BY message_timestamp DESC LIMIT 1;`,
        });
        if (gameIdInTurns.rows.length === 0) {
            return false;
        } else {
            console.log(`turnIsInProgress message.member = ${message.member}`);
            const result = await client.query({
                rowMode: "array",
                text: `SELECT turns_id ` +
                    `FROM public.turns ` +
                    `WHERE text_channel_id = ${message.channel.id} ` +
                    `AND turn_is_active = true ` +
                    `AND point_earned = 1 ` +
                    `ORDER BY message_timestamp DESC LIMIT 1;`,
            });
            console.log(`turnIsInProgress result.rows = ${result.rows}`);
            console.log(`turnIsInProgress result.rows.length = ${result.rows.length}`);
            if (result.rows.length === 1) {
                return false;
            }
            if (result.rows.length === 0) {
                return true;
            }
        }
    } catch (err) {
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
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
        "Banana Blast",
        "Cheeky Monkey",
        "Monkey Madness",
        "Go Ape!",
    ];
    shuffle(statusArray);
    console.log(statusArray[0]);
    var test = await bot.user.setActivity("Gorilla Marketing", {
        type: "Playing",
    });
    console.log(`test = ${Promise.resolve(test)}`);
}

async function messageArchive(message) {
    const client = await pool.connect();
    try {
        const prepMessageArchive = {
            readable_timestamp: getTimeStamp(),
            guild_name: message.guild.name,
            guild_id: message.guild.id,
            channel_name: message.channel.name,
            channel_id: message.channel.id,
            message_id: message.id,
            author_id: message.author.id,
            author_username: message.author.username,
            member_nickname: message.member.nickname,
            message_timestamp: message.createdTimestamp,
            message_content: message.mentions._content,
        };
        await client.query("BEGIN");
        const insertMessageArchiveText =
            `INSERT INTO public.message_archive(readable_timestamp, guild_name, guild_id, ` +
            `channel_name, channel_id, message_id, author_id, author_username, ` +
            `member_nickname, message_timestamp, message_content) ` +
            `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
        const insertMessageArchiveValues = [
            prepMessageArchive.readable_timestamp,
            prepMessageArchive.guild_name,
            prepMessageArchive.guild_id,
            prepMessageArchive.channel_name,
            prepMessageArchive.channel_id,
            prepMessageArchive.message_id,
            prepMessageArchive.author_id,
            prepMessageArchive.author_username,
            prepMessageArchive.member_nickname,
            prepMessageArchive.message_timestamp,
            prepMessageArchive.message_content,
        ];
        await client.query(insertMessageArchiveText, insertMessageArchiveValues);
        await client.query("COMMIT");
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

async function dmArchive(message) {
    const client = await pool.connect();
    try {
        const prepDmArchive = {
            readable_timestamp: getTimeStamp(),
            author_username: message.author.username,
            author_id: message.author.id,
            message_timestamp: message.createdTimestamp,
            message_content: message.content,
        };
        await client.query("BEGIN");
        const insertDmArchiveText =
            `INSERT INTO public.dm_archive(readable_timestamp, author_username, ` +
            `author_id, message_timestamp, message_content) ` +
            `VALUES ($1, $2, $3, $4, $5)`;
        const insertDmArchiveValues = [
            prepDmArchive.readable_timestamp,
            prepDmArchive.author_username,
            prepDmArchive.author_id,
            prepDmArchive.message_timestamp,
            prepDmArchive.message_content,
        ];
        await client.query(insertDmArchiveText, insertDmArchiveValues);
        await client.query("COMMIT");
    } catch (err) {
        console.log(err.stack);
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}
// Super Secret Token!!!
bot.login(config.token);