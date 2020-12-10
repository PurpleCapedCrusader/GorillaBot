const Discord = require("discord.js");
const config = require("./config.json");
var dbCreds = require("./dbCreds.js");
var lowerCase = require("lower-case");
var gameRooms = require("./gameRooms.js");
const databaseCheck = require("./databaseBuilder.js");
var _ = require("lodash");
const fetch = require("node-fetch");
// const fs = require("fs");
// var check = require("check-types");
// const express = require("express");
const bot = new Discord.Client();
const PREFIX = config.prefix;
const { Pool } = require("pg");
const { string } = require("check-types");
const { get } = require("lodash");
const { stringify } = require("querystring");
const pool = new Pool(dbCreds);
bot.on("ready", () => {
	console.log(
		`${getTimeStamp()} :: GorillaBot is ready to serve on ${
			bot.guilds.cache.size
		} servers, for ${bot.users.cache.size} users.`
	);
	updateStatus();
	adminNotify(`GorillaBot started: ${getTimeStamp()}`);
	databaseCheck.createDatabaseTablesIfNotExist;
});

// TODO: Additional features ideas:
// Restart bot if fatal error
// Display total standings for all players of all games
// 123

// error catch-all
bot.on("error", (e) => console.error(`ERROR: ${getTimeStamp()} :: ${e}`));
bot.on("warn", (e) => console.warn(`WARN: ${getTimeStamp()} :: ${e}`));
bot.on("debug", (e) => console.info(`DEBUG: ${getTimeStamp()} :: ${e}`));

// Link to game data
bot.diceData = require("./diceData.json");
bot.leafletData = require("./leafletData.json");

bot.on("guildMemberAdd", (member) => {
	const embed1 = new Discord.MessageEmbed()
		.setColor("0xff0000")
		.setTitle("**Welcome**")
		.addField(
			`**GLAD YOU'RE HERE!!**`,
			`I'm GorillaBot and I help run the games.\n\u200b` +
				`Use the commands below to play games and interact with me.\n\u200b`
		)
		.addField(
			`**LIST OF COMMANDS**`,
			`**!help** - There's no need to remember all of these commands. Use **!help** to bring up this list.\n\u200b`
		)
		.addField(
			`**START A GAME**`,
			`Choose a theme and start a game by typing **!Bands**, **!College Courses**, ` +
				`**!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or ` +
				`**!Products** in the text channel of one of the game tables.\n\u200b`
		)
		.addField(
			`**JOIN A GAME**`,
			`After a player starts the game, the rest of the players can use **!play** to join the game.\n\u200b`
		)
		.addField(
			`**ROLL**`,
			`**Active Player**: use the **!roll** command to start the turn.\n\u200b` +
				`GorillaBot will DM all players.\n\u200b`
		)
		.addField(
			`**WRITE**`,
			`**All Players**: Open your DM from GorillaBot\n\u200b` +
				`**Active Player**: Add a reaction emoji to the award you want to give.\n\u200b` +
				`**All Other Players**: Respond with the Title (round 1) or Tagline (round 2) ` +
				`you create based on the acronym formed by your dice.\n\u200b` +
				`**All players**: Return to the text channel at your table.\n\u200b`
		)
		.addField(
			`**AWARD**`,
			`**Active Player**: Use a reaction emoji to award your favorite title or tagline with a banana (point).\n\u200b` +
				`Choose a player, who hasn't been the Active Player this round, to be the new Active Player\n\u200b` +
				`Repeat from the **ROLL** phase and have fun!!!\n\u200b`
		)
		.addField(
			`**GAME OVER**`,
			`The game ends once all players have completed two turns as the Active Player.\n\u200b` +
				`The score is displayed and the table is reset for the next game.\n\u200b`
		);
	member.send(embed1).catch(console.error);
	const embed2 = new Discord.MessageEmbed().addField(
		`**WORD HELP**`,
		`While in the GorillaBot DM channel, enter "!word", a single word, and a single letter.\n\u200b` +
			`**!word gorilla m** will return up to 25 words that start with the letter "M" and that are related to the word "Gorilla".\n\u200b` +
			`You can also add a number to get back more or less words. **!word gorilla m 50** will return up to 50 words.\n\u200b`
	);
	member.send(embed2).catch(console.error);
	const embed3 = new Discord.MessageEmbed().addField(
		`**COMMANDS**`,
		`**!roll** - When used while not in a game, GorillaBot will send a single dice roll.\n\u200b` +
			`**!score** - displays current score.\n\u200b` +
			`**!players** - displays a list of players and how many times each has been the Active Player.\n\u200b` +
			`**!leave** - Have to go? Use the **!leave** command to exit. If you return, use **!play** to re-join the game.\n\u200b` +
			`**!remove @name** - If a player stops responding? (computer crash, internet outage, etc.) Keep the game moving forward by ` +
			`removing that player from the game. If they come back, they can use **!play** to re-join the game.\n\u200b` +
			`**!reset** - clears the table for a new game.\n\u200b`
	);
	// .setURL([`Gorilla Marketing Rules`](`https://cdn.shopify.com/s/files/1/0246/2190/8043/t/5/assets/07d4153e02b0--Gorilla-Marketing-Rulebook-Web-2020.02.01-fa36f9.pdf?6037`))
	member.send(embed3).catch(console.error);
});

setInterval(function () {
	updateStatus();
}, 900000); // 86400000 = 1day, 3600000 = 1hr, 60000 = 1min
// }, 60000);

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
		// case "answers":
		// case "titles":
		// case "taglines":
		// case "tag":
		// case "tags":
		//     // TODO: set all submissions to true and display answers
		// break;

		// case "change":
		//     // TODO: update current turn with a new title or tagline submission
		// break;

		// case "resend":
		//     // TODO: resend latest info(roll or awards) to DM of message.author
		// break;

		case "help":
			var embed = new Discord.MessageEmbed()
				.setColor("0xff0000")
				.addField(
					`**START A GAME**`,
					`Choose a theme and start a game by typing **!Bands**, **!College Courses**, ` +
						`**!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or ` +
						`**!Products** in the text channel of one of the game tables.\n\u200b`
				)
				.addField(
					`**JOIN A GAME**`,
					`After a player starts the game, the rest of the players can use **!play** to join the game.\n\u200b`
				)
				.addField(
					`**ROLL**`,
					`**Active Player**: use the **!roll** command to start the turn.\n\u200b` +
						`GorillaBot will DM all players.\n\u200b`
				)
				.addField(
					`**WRITE**`,
					`**All Players**: Open your DM from GorillaBot\n\u200b` +
						`**Active Player**: Add a reaction emoji to the award you want to give.\n\u200b` +
						`**All Other Players**: Respond with the Title (round 1) or Tagline (round 2) ` +
						`you create based on the acronym formed by your dice.\n\u200b` +
						`**All players**: Return to the text channel at your table.\n\u200b`
				)
				.addField(
					`**AWARD**`,
					`**Active Player**: Use a reaction emoji to award your favorite title or tagline with a banana (point).\n\u200b` +
						`Choose a player, who hasn't been the Active Player this round, to be the new Active Player\n\u200b` +
						`Repeat from the **ROLL** phase and have fun!!!\n\u200b`
				)
				.addField(
					`**GAME OVER**`,
					`The game ends once all players have completed two turns as the Active Player.\n\u200b` +
						`The score is displayed and the table is reset for the next game.\n\u200b`
				)
				.addField(
					`**WORD HELP**`,
					`While in the GorillaBot DM channel, enter "!word", a single word, and a single letter.\n\u200b` +
						`**!word gorilla m** will return up to 25 words that start with the letter "M" and that are related to the word "Gorilla".\n\u200b` +
						`You can also add a number to get back more or less words. **!word gorilla m 50** will return up to 50 words.\n\u200b`
				)
				.addField(
					`**COMMANDS**`,
					`**!roll** - When used while not in a game, GorillaBot will send a single dice roll.\n\u200b` +
						`**!score** - displays current score.\n\u200b` +
						`**!players** - displays a list of players and how many times each has been the Active Player.\n\u200b` +
						`**!leave** - Have to go? Use the **!leave** command to exit. If you return, use **!play** to re-join the game.\n\u200b` +
						`**!remove @name** - If a player stops responding? (computer crash, internet outage, etc.) Keep the game moving forward by ` +
						`removing that player from the game. If they come back, they can use **!play** to re-join the game.\n\u200b` +
						`**!reset** - clears the table for a new game.\n\u200b`
				);
			message.channel.send(embed).catch(console.error);
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
				message.channel.send(
					`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``
				);
				dmError(err);
			}
			break;

		case "leave":
			if (message.channel.type === "dm") {
				message.channel.send(
					`The **!leave** command only works at a game table during a game.`
				);
			} else {
				let playerId = message.author.id;
				removePlayer(message, playerId);
			}
			break;

		case "play":
			if (message.channel.type === "dm") {
				message.channel.send(
					`The **!play** command only works at a game table once a game has started.`
				);
			} else {
				play(message);
			}
			break;

		case "player":
		case "players":
			if (message.channel.type === "dm") {
				message.author.send(
					`That command doesn't work in direct messages.`
				);
			} else {
				players(message);
			}
			break;

		case "reboot": // TODO: NOT WORKING CORRECTLY
			if (message.author.id !== config.ownerID) {
				return;
			}
			try {
				message.channel.send("Rebooting...").then(() => {
					bot.destroy().then(() => {
						bot.login(config.token);
					});
				});
			} catch (err) {
				console.log(err.stack);
				dmError(err);
				throw err;
			}
			break;

		case "remove":
			if (message.channel.type === "dm") {
				message.author.send(
					`That command doesn't work in direct messages.`
				);
			} else {
				// TODO: verify the author is a player in the game
				let playerId = message.mentions.users.first().id;
				removePlayer(message, playerId);
			}
			break;

		case "reset":
			// TODO: Stop other users from reseting a game they're not playing in.
			if (message.channel.type === "dm") {
				message.author.send(
					`That command doesn't work in direct messages.`
				);
			} else {
				getGameId(message).then((results) => {
					gameId = results;
					if (gameId > 0) {
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
				getGameId(message)
					.then((results) => {
						channelGameId = parseInt(results);
						playerInActiveGame(message)
							.then((results) => {
								playerGameId = parseInt(results);
								console.log(
									`!roll: getGameId returned ${channelGameId} & playerInActiveGame returned ${playerGameId}`
								);
								if (channelGameId == 0) {
									message.channel.send(rollDice());
									return;
								} else if (
									channelGameId > 0 &&
									playerGameId == 0
								) {
									message.channel.send(
										`${message.member}, use the !play comand to join the game before using !roll.`
									);
								} else if (
									channelGameId > 0 &&
									playerGameId > 0 &&
									channelGameId != playerGameId
								) {
									message.channel.send(
										`${message.member}, your game is at a different table.`
									);
								} else if (
									channelGameId > 0 &&
									playerGameId > 0 &&
									channelGameId == playerGameId
								) {
									activePlayerCount(channelGameId).then(
										(results) => {
											playerCount = results;
											// });
											if (playerCount >= 2) {
												// TODO: update to 3 upon deploy
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
														} else if (
															turnsTaken < 2
														) {
															gameIsInProgress(
																message
															).then(
																(results) => {
																	isGame = results;
																	console.log(
																		`inside case roll -> gameIsInProgress() -> gameIs = ${isGame}`
																	);
																	if (
																		isGame ==
																		"true"
																	) {
																		turnIsInProgress(
																			message
																		).then(
																			(
																				results
																			) => {
																				turnIs = results;
																				console.log(
																					`inside case roll -> turnIsInProgress() -> turnIs = ${turnIs}`
																				);
																				if (
																					turnIs ==
																					true
																				) {
																					message.channel.send(
																						`The Active Player must use a reaction emoji on the winning title or tagline before the next player can !roll.`
																					);
																				} else {
																					endTurn(
																						message
																					).then(
																						roll_for_game(
																							message
																						)
																					);
																				}
																			}
																		);
																	} else {
																		message.channel.send(
																			`Use the **!Bands**, **!College Courses**, **!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or **!Products** command to start a game.`
																		);
																	}
																}
															);
														}
													})
													.catch((err) => {
														dmError(err);
														console.error(err);
													});
											} else {
												message.channel.send(
													rollDice()
												);
											}
										}
									);
								} else {
									message.channel.send(rollDice());
								}
							})
							.catch((err) => {
								dmError(err);
								console.error(err);
							});
					})
					.catch((err) => {
						dmError(err);
						console.error(err);
					});
			}
			break;

		case "score":
		case "🍌":
			if (message.channel.type === "dm") {
				message.author.send(
					`That command doesn't work in direct messages.`
				);
			} else {
				(async () => {
					const client = await pool.connect();
					try {
						const gameSessionId = await client.query({
							rowMode: "array",
							text:
								`SELECT game_session_id ` +
								`FROM public.turns ` +
								`WHERE text_channel_id = ${message.channel.id} ` +
								`AND game_is_active = true ` +
								`ORDER BY message_timestamp DESC LIMIT 1;`,
						});
						if (gameSessionId.rows.length != 0) {
							score(gameSessionId.rows);
						} else {
							message.channel.send(`There is no score yet.`);
							return;
						}
					} catch (err) {
						dmError(err);
						throw err;
					} finally {
						client.release();
					}
				})().catch((err) => {
					dmError(err);
					console.error(err.stack);
				});
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
				message.author.send(
					`That command doesn't work in direct messages.`
				);
			} else {
				if (
					gameRooms.textChannels.indexOf(message.channel.name) >= 0 &&
					gameRooms.textChannels.indexOf(message.channel.name) <=
						gameRooms.textChannels.length
				) {
					gameIsInProgress(message)
						.then((results) => {
							isGame = results;
							console.log(
								`theme choice -> gameIsInProgress() -> gameIs = ${isGame}`
							);
							if (isGame == "true") {
								message.channel.send(
									`This table is in use. Please choose ` +
										`a different table or use the **!reset** ` +
										`command to close the current game.`
								);
							} else {
								playerInActiveGame(message)
									.then((results) => {
										playerInGame = results;
										console.log(
											`playerInGame = ${playerInGame}`
										);
										if (playerInGame > 0) {
											playerInAnotherGame(message);
											return;
										} else if (playerInGame == 0) {
											startGame(message).then(() => {
												play(message);
											});
											adminNotify(
												`GAME STARTED at the ${
													message.channel.parent.name
												} at ${getTimeStamp()}`
											);
											console.log(
												`GAME STARTED at the ${message.channel.parent.name}`
											);
										}
									})
									.catch((err) => {
										dmError(err);
										console.error(err);
									});
							}
						})
						.catch((err) => {
							dmError(err);
							console.error(err);
						});
				} else {
					message.channel.send(
						`Games can only be played at the primate tables.`
					);
				}
			}
			break;

		case "word":
		case "words":
			if (message.channel.type === "dm") {
				datamuse(message);
			} else {
				message.channel.send(
					`That command only works in direct messages.`
				);
			}
			break;

		case "t":
			fromDatabase(message);
			break;
	}
});

bot.on("messageReactionAdd", async (reaction, user) => {
	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		console.log("messageReactionAdd Partial");
		try {
			await reaction.fetch();
		} catch (err) {
			console.log(
				"Something went wrong when fetching the message: ",
				err
			);
			dmError(err);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}
	console.log(`reaction.message.content = ${reaction.message.content}`);
	console.log(`reaction.message.channel.id = ${reaction.message.channel.id}`);
	console.log(
		`reaction.message.channel.type = ${reaction.message.channel.type}`
	);
	console.log(`user.id = ${user.id}`);

	const client = await pool.connect();
	try {
		// TODO: add check for user in active game - error is getting thrown if reaction is added after game ends
		if (reaction.message.channel.type == "dm") {
			const turnIsActive = await client.query({
				rowMode: "array",
				text:
					`SELECT turn_is_active ` +
					`FROM public.turns ` +
					`WHERE active_player_id = ${user.id} ` +
					`AND game_is_active = true ` +
					`ORDER BY message_timestamp DESC LIMIT 1;`,
			});
			const turnAsActivePlayer = await client.query({
				rowMode: "array",
				text:
					`SELECT turns_as_active_player ` +
					`FROM public.game_leaflet ` +
					`WHERE player_id = ${user.id} ` +
					`AND game_is_active = true ` +
					`ORDER BY game_leaflet_id DESC LIMIT 1;`,
			});
			const gameSessionID = await client.query({
				rowMode: "array",
				text:
					`SELECT game_session_id ` +
					`FROM public.game_leaflet ` +
					`WHERE player_id = ${user.id} ` +
					`AND game_is_active = true ` +
					`ORDER BY game_leaflet_id DESC LIMIT 1`,
			});
			console.log(`pre turnAsActivePlayer = ${turnAsActivePlayer.rows}`);
			console.log(`last turnIsActive.rows = ${turnIsActive.rows}`);
			if (turnIsActive.rows == "true") {
				if (turnAsActivePlayer.rows == "1") {
					console.log(
						`turnAsActivePlayer = ${turnAsActivePlayer.rows}`
					);
					await client.query(
						`UPDATE public.game_leaflet ` +
							`SET title_judge_choice = $$${reaction.message.content}$$ ` +
							`WHERE player_id = ${user.id} ` +
							`AND game_is_active = true;`
					);
				}
				if (turnAsActivePlayer.rows == "2") {
					console.log(
						`turnAsActivePlayer = ${turnAsActivePlayer.rows}`
					);
					await client.query(
						`UPDATE public.game_leaflet ` +
							`SET tagline_judge_choice = $$${reaction.message.content}$$ ` +
							`WHERE player_id = ${user.id} ` +
							`AND game_is_active = true;`
					);
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
					`AND turn_is_active = true`
			);
			pointAlreadyGiven.rows.forEach((row) => {
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
				text:
					`SELECT active_player_id ` +
					`FROM public.turns ` +
					`WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
					`AND turn_is_active = true ` +
					`ORDER BY message_timestamp DESC LIMIT 1;`,
			});
			const turnWinnerData = await client.query(
				`SELECT * FROM public.turns ` +
					`WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
					`AND turn_is_active = true ` +
					`ORDER BY message_timestamp DESC LIMIT 1;`
			);
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
						`AND point_earned = 0;`
				);
				const total_points = await client.query({
					rowMode: "array",
					text:
						`SELECT total_points ` +
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
						`AND player_id = ${playerId}`
				);

				const turnWinnerData = await client.query(
					`SELECT * ` +
						`FROM public.turns ` +
						`WHERE dice_and_tagline = $$${reaction.message.content}$$ ` +
						`AND turn_is_active = true ` +
						`ORDER BY message_timestamp DESC LIMIT 1;`
				);
				turnWinnerData.rows.forEach((row) => {
					gameSessionId = row.game_session_id;
					playerId = row.player_id;
					textChannelId = row.text_channel_id;
				});
				const total_players = await client.query({
					rowMode: "array",
					text:
						`SELECT game_leaflet_id ` +
						`FROM public.game_leaflet ` +
						`WHERE game_session_id = ${gameSessionId} ` +
						`AND left_game = false;`,
				});
				const twoTurns = await client.query({
					rowMode: "array",
					text:
						`SELECT game_leaflet_id ` +
						`FROM public.game_leaflet ` +
						`WHERE game_session_id = ${gameSessionId} ` +
						`AND turns_as_active_player = 2 ` +
						`AND left_game = false;`,
				});
				console.log(
					`total_players.rows.length = ${total_players.rows.length}`
				);
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
							gameChannel.send(
								`\n\u200b\n\u200b**Final Score:**`
							);
						})
						.then(score(gameSessionId))
						.then(resetTable(gameSessionId));
				}
			}
		}
	} catch (err) {
		await client.query("ROLLBACK");
		console.log(err.stack);
		dmError(err);
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
		} catch (err) {
			console.log(
				"Something went wrong when fetching the message: ",
				err
			);
			dmError(err);
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
			text:
				`SELECT active_player_id ` +
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
					`AND point_earned = 1;`
			);
		}
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
});

async function datamuse(message) {
	try {
		let params = message.content.substring(PREFIX.length).split(/ +/g);
		console.log(`datamuse search - ${message.author.username}: ${params}`);
		if (!params.length) {
			return message.channel.send("You need to supply a search term!");
		}
		const list = await fetch(
			`http://api.datamuse.com/words?ml=${params[1]}&sp=${params[2]}*`
		).then((response) => response.json());
		if (!list.length) {
			return message.channel.send(
				`No results found for **${params.join(" ")}**.`
			);
		}
		if (params[3] == null) {
			numberOfWordsRequested = 25;
		} else {
			numberOfWordsRequested = params[3];
		}
		let wordList = "";
		for (var i = 0; i <= list.length; i++) {
			wordList = wordList.concat(`${list[i].word}, `);
			if (i == numberOfWordsRequested - 1 || i == list.length - 1) {
				message.channel.send(wordList);
				return;
			}
		}
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		throw err;
	}
}

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

function dmError(err) {
	let adminUser = bot.users.cache.get(`${config.adminID}`);
	adminUser.send(`ERROR: ${getTimeStamp()} :: ${err.stack}`);
}

function adminNotify(msg) {
	//Admin user object for DM notifications
	let adminUser = bot.users.cache.get(`${config.adminID}`);
	console.log(`adminUser = ${adminUser}`);
	adminUser.send(msg);
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
            WHERE text_channel_id = ${message.channel.id};`
		);
	} catch (err) {
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

async function gameIsInProgress(message) {
	const client = await pool.connect();
	try {
		const result = await client.query({
			rowMode: "array",
			text:
				`SELECT game_is_active ` +
				`FROM public.games ` +
				`WHERE text_channel_id = ${message.channel.id} ` +
				`ORDER BY message_timestamp DESC LIMIT 1`,
		});
		await client.release();
		console.log(`gameIsInProgres() game_is_active = ${result.rows}`);
		if (result.rows.length === 0) {
			return false;
		} else {
			return result.rows;
		}
	} catch (err) {
		dmError(err);
		throw err;
	}
}

async function getGameId(message) {
	const client = await pool.connect();
	try {
		const gameId = await client.query({
			rowMode: "array",
			text:
				`SELECT game_id ` +
				`FROM public.games ` +
				`WHERE text_channel_id = ${message.channel.id} ` +
				`AND game_is_active = true ` +
				`ORDER BY message_timestamp DESC LIMIT 1;`,
		});
		if (gameId.rows.length === 0) {
			console.log(`should be 0 = ${gameId.rows}`);
			return 0;
		} else {
			console.log(`should be a # = ${gameId.rows}`);
			return gameId.rows;
		}
	} catch (err) {
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

function getTimeStamp() {
	let now = new Date();
	return "[" + now.toLocaleString() + "]";
}

async function removePlayer(message, playerId) { //REMOVE TAble ROLE TO SHOW PLAYER NOLONGER AT A TABLE
	const client = await pool.connect();
	try {
		await getGameId(message).then((results) => {
			gameId = parseInt(results);
			console.log(`leave() > parseInt(gameId.rows) = ${gameId}`);
		});
		if (gameId == 0) {
			message.channel.send(`There is currently no game to leave.`);
			return;
		}
		playerInActiveGame(message)
			.then((results) => {
				playerGameId = parseInt(results);
				if (gameId != playerGameId) {
					message.channel.send(
						`That command is reserved for players in the game.`
					);
				} else {
					(async () => {
						const activePlayer = await client.query({
							rowMode: "array",
							text:
								`SELECT active_player_id ` +
								`FROM public.turns ` +
								`WHERE game_session_id = ${gameId} ` +
								`AND turn_is_active = true ` +
								`ORDER BY message_timestamp DESC LIMIT 1`,
						});
						await client.query(
							`UPDATE public.game_leaflet ` +
								`SET playing = false, ` +
								`queued = false, ` +
								`left_game = true ` +
								`WHERE game_session_id = ${gameId} ` +
								`AND player_id = ${playerId} `
						);
						if (parseInt(activePlayer.rows) != parseInt(playerId)) {
							message.channel.send(
								`<@${playerId}> has left the game.`
							);
						}
						if (
							parseInt(activePlayer.rows) === parseInt(playerId)
						) {
							const total_players = await client.query({
								rowMode: "array",
								text:
									`SELECT game_leaflet_id ` +
									`FROM public.game_leaflet ` +
									`WHERE game_session_id = ${gameId} ` +
									`AND left_game = false;`,
							});
							const twoTurns = await client.query({
								rowMode: "array",
								text:
									`SELECT game_leaflet_id ` +
									`FROM public.game_leaflet ` +
									`WHERE game_session_id = ${gameId} ` +
									`AND turns_as_active_player = 2 ` +
									`AND left_game = false;`,
							});
							if (
								total_players.rows.length !=
								twoTurns.rows.length
							) {
								endTurn(message);
								message.channel.send(
									`<@${playerId}> has left the game.`
								);
								message.channel.send(
									`\n\u200bReady for next player to **!roll**`
								);
							}
							if (
								total_players.rows.length ===
								twoTurns.rows.length
							) {
								message.channel.send(
									`<@${playerId}> has left the game.`
								);
								message.channel.send(
									`\n\u200b\n\u200b**Final Score:**`
								);
								endTurn(message).then(
									score(gameId).then(resetTable(gameId))
								);
							}
						}
					})().catch((err) => {
						dmError(err);
						console.error(err.stack);
					});
				}
			})
			.catch((err) => {
				dmError(err);
				console.error(err);
			});
	} catch (err) {
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

async function play(message) { //ADD ROLE UPDATE TO SHOW PLAYER AT A TABLE
	const client = await pool.connect();
	try {
		// Situations:
		// 1. trying to join a game while in another game
		// 2. trying to join the same game you're in
		// 3. trying to join a game at a table where there is no game
		// 4. trying to join a game where there is a game while not in another game - normal

		await getGameId(message)
			// returns game_id or 0 for this text channel - public.games
			.then((results) => {
				gameId = parseInt(results);
				console.log(`1 play() gameId = ${gameId}`);
			})
			.catch((err) => {
				dmError(err);
				console.error(err);
			});
		const playersGame = await client.query(
			`SELECT * ` +
				`FROM public.game_leaflet ` +
				`WHERE game_is_active = true ` +
				`AND player_id = ${message.member.id};`
		);
		playersGame.rows.forEach((row) => {
			gameLeafletId = parseInt(row.game_leaflet_id);
			playerIsInGame = parseInt(row.game_session_id);
			playerIsQueued = row.queued;
			playerIsPlaying = row.playing;
			playerLeftGame = row.left_game;
			playersGameTextChannelId = row.text_channel_id;
		});
		if (playersGame.rows.length === 0) {
			playerIsInGame = 0;
		}
		if (
			// trying to join the game you're in
			playerIsInGame > 0 &&
			gameId == playerIsInGame &&
			playerLeftGame == false
		) {
			message.channel.send(
				`${message.member}, you're already in the game at this table.`
			);
		} else if (
			// trying to re-join the game you left
			playerIsInGame > 0 &&
			gameId == playerIsInGame &&
			playerLeftGame == true
		) {
			message
				.delete()
				.then(
					message.channel.send(
						`Welcome back ${message.member}. You'll be included in the next !roll.`
					)
				);
			await client.query(
				`UPDATE public.game_leaflet ` +
					`SET queued = true, ` +
					`playing = false, ` +
					`left_game = false ` +
					`WHERE game_leaflet_id = ${gameLeafletId} `
			);
			return;
		} else if (
			//trying to join a game while in another game
			playerIsInGame > 0 &&
			gameId != playerIsInGame
		) {
			message.channel.send(
				`${message.member}, you're already playing a game in the <#${playersGameTextChannelId}> channel.`
			);
		} else if (
			// trying to join a game where there is no game
			gameId == 0 &&
			playerIsInGame == 0
		) {
			message.channel.send(
				`First, a player types **!Bands**, **!College Courses**, ` +
					`**!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or ` +
					`**!Products** to create and join the game. \n\u200b \n\u200b` +
					`Then the rest of the players use the **!play** command to join the game.\n\u200b \n\u200b`
			);
		} else if (
			// joining a game
			gameId > 0 &&
			playerIsInGame == 0
		) {
			const playerCount = await client.query(
				`SELECT game_leaflet_id ` +
					`FROM public.game_leaflet ` +
					`WHERE game_session_id = ${gameId} `
			);
			console.log(`playerCount = ${JSON.stringify(playerCount)}`);
			console.log(`playerCount.rowCount = ${playerCount.rowCount}`);
			let themeCategoryRollArray = [];
			let titleJudgeRollArray = [];
			let taglineJudgeRollArray = [];
			console.log(
				`leafletUpdate() > parseInt(gameId) = ${parseInt(gameId)}`
			);
			const themeAndJudgeArrays = await client.query(
				`SELECT ` +
					`theme_category_roll_array, ` +
					`title_judge_roll_array, ` +
					`tagline_judge_roll_array ` +
					`FROM public.games ` +
					`WHERE game_id = ${gameId} ` +
					`AND game_is_active = true;`
			);
			themeAndJudgeArrays.rows.forEach((row) => {
				themeCategoryRollArray = row.theme_category_roll_array;
				titleJudgeRollArray = row.title_judge_roll_array;
				taglineJudgeRollArray = row.tagline_judge_roll_array;
			});
			const prepGameLeaflet = {
				game_session_id: parseInt(gameId),
				game_is_active: true,
				player_id: message.author.id,
				queued: true,
				playing: false,
				left_game: false,
				turns_as_active_player: 0,
				theme_category_roll:
					themeCategoryRollArray[playerCount.rowCount],
				title_judge_roll: titleJudgeRollArray[playerCount.rowCount],
				title_judge_choice: null,
				tagline_judge_roll: taglineJudgeRollArray[playerCount.rowCount],
				tagline_judge_choice: null,
				total_points: 0,
				category_id: message.channel.parent.id,
				text_channel_id: message.channel.id,
			};
			await client.query("BEGIN");
			const insertGameLeafletText =
				`INSERT INTO public.game_leaflet(game_session_id, game_is_active, player_id, ` +
				`queued, playing, left_game, turns_as_active_player, theme_category_roll, ` +
				`title_judge_roll, title_judge_choice, tagline_judge_roll, tagline_judge_choice, ` +
				`total_points, category_id, text_channel_id) ` +
				`VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;
			const insertGameLeafletValues = [
				prepGameLeaflet.game_session_id,
				prepGameLeaflet.game_is_active,
				prepGameLeaflet.player_id,
				prepGameLeaflet.queued,
				prepGameLeaflet.playing,
				prepGameLeaflet.left_game,
				prepGameLeaflet.turns_as_active_player,
				prepGameLeaflet.theme_category_roll,
				prepGameLeaflet.title_judge_roll,
				prepGameLeaflet.title_judge_choice,
				prepGameLeaflet.tagline_judge_roll,
				prepGameLeaflet.tagline_judge_choice,
				prepGameLeaflet.total_points,
				prepGameLeaflet.category_id,
				prepGameLeaflet.text_channel_id,
			];
			await client.query(insertGameLeafletText, insertGameLeafletValues);
			await client.query("COMMIT");
			message
				.delete()
				.then(
					message.channel.send(
						`<@${message.member.id}> has taken a seat at the table`
					)
				);
		}
	} catch (err) {
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

async function activePlayerCount(channelGameId) {
	const client = await pool.connect();
	try {
		const playersPlaying = await client.query(
			`SELECT game_leaflet_id ` +
				`FROM public.game_leaflet ` +
				`WHERE game_session_id = ${channelGameId} ` +
				`AND left_game = false `
		);
		if (playersPlaying.rows.length === 0) {
			return 0;
		} else {
			return playersPlaying.rows.length;
		}
	} catch (err) {
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

async function playerInActiveGame(message) {
	const client = await pool.connect();
	try {
		const playersInActiveGames = await client.query({
			rowMode: "array",
			text:
				`SELECT game_session_id ` +
				`FROM public.game_leaflet ` +
				`WHERE player_id = ${message.member.id} ` +
				`AND game_is_active = true ` +
				`AND left_game = false;`,
		});
		console.log(
			`playersInActiveGames() game_session_id = ${playersInActiveGames.rows}`
		);
		if (playersInActiveGames.rows.length === 0) {
			return 0;
		} else {
			return playersInActiveGames.rows;
		}
	} catch (err) {
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

async function playerInAnotherGame(message) {
	console.log(`inside playerInAnotherGame()`);
	const client = await pool.connect();
	try {
		const playersInActiveGames = await client.query({
			rowMode: "array",
			text:
				`SELECT game_session_id ` +
				`FROM public.game_leaflet ` +
				`WHERE player_id = ${message.member.id} ` +
				`AND game_is_active = true;`,
		});
		console.log(`playersInActiveGames.rows = ${playersInActiveGames.rows}`);
		const textChannelId = await client.query({
			rowMode: "array",
			text:
				`SELECT text_channel_id ` +
				`FROM public.games ` +
				`WHERE game_id = ${playersInActiveGames.rows} ` +
				`AND game_is_active = true;`,
		});
		console.log(`textChannelId.rows = ${textChannelId.rows}`);
		message.channel.send(
			`<@${message.member.id}>, you're already playing a game in the ` +
				`<#${textChannelId.rows}> channel. You can only play 1 game at a time.`
		);
		return;
	} catch (err) {
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

async function players(message) {
	const client = await pool.connect();
	try {
		await getGameId(message).then((results) => {
			gameId = parseInt(results);
		});
		if (gameId == 0) {
			message.channel.send(`There is no game at this table`);
			return;
		}
		const gameLeafletData = await client.query(
			`SELECT * ` +
				`FROM public.game_leaflet ` +
				`WHERE game_session_id = ${gameId};`
		);
		message.channel.send(`**Turns as Active Player**`);
		gameLeafletData.rows.forEach((row) => {
			// let turnsAsActivePlayer = row.turns_as_active_player;
			if (row.left_game == true) {
				message.channel.send(
					`~~<@${row.player_id}>~~  ::  **${row.turns_as_active_player}**  ::  player left game.`
				);
			} else {
				message.channel.send(
					`<@${row.player_id}>  ::  **${row.turns_as_active_player}**`
				);
			}
		});
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

async function playerTurnsTaken(message) {
	const client = await pool.connect();
	try {
		const numberOfTurns = await client.query({
			rowMode: "array",
			text:
				`SELECT turns_as_active_player ` +
				`FROM public.game_leaflet ` +
				`WHERE player_id = ${message.member.id} ` +
				`AND text_channel_id = ${message.channel.id} ` +
				`AND game_is_active = true;`,
		});
		return numberOfTurns.rows;
	} catch (err) {
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

async function queuedPlayerUpdate(message) {
	const client = await pool.connect();
	try {
		await getGameId(message).then((results) => {
			gameId = results;
		});
		client.query(
			`UPDATE public.game_leaflet ` +
				`SET playing = true, ` +
				`queued = false ` +
				`WHERE game_session_id = ${gameId} ` +
				`AND queued = true ` +
				`AND left_game = false;`
		);
	} catch (err) {
		await client.query("ROLLBACK");
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

async function resetTable(gameId) { //REMOVE TABLE ROLE FROM ALL PLAYERS IN GAME TO SHOW PLAYER NOLONGER AT A TABLE
	const client = await pool.connect();
	try {
		const textChannelId = await client.query({
			rowMode: "array",
			text:
				`SELECT text_channel_id ` +
				`FROM public.games ` +
				`WHERE game_id = ${gameId} ` +
				`ORDER BY message_timestamp DESC LIMIT 1;`,
		});
		client.query(
			`UPDATE public.games ` +
				`SET game_is_active = false ` +
				`WHERE game_id = ${gameId}`
		);
		// client.query(
		// 	`UPDATE public.turns ` +
		// 	`SET game_is_active = false, ` +
		// 	`turn_is_active = false, ` +
		// 	`title_tagline_is_submitted = true `
		// 	`WHERE game_session_id = ${gameId}`
		// );
		client.query(
			`UPDATE public.turns ` +
				`SET game_is_active = false ` +
				`WHERE game_session_id = ${gameId}`
		);
		client.query(
			`UPDATE public.turns ` +
				`SET turn_is_active = false ` +
				`WHERE game_session_id = ${gameId}`
		);
		client.query(
			`UPDATE public.turns ` +
				`SET title_tagline_is_submitted = true ` +
				`WHERE game_session_id = ${gameId}`
		);
		// client.query(
		// 	`UPDATE public.game_leaflet ` +
		// 	`SET game_is_active = false, ` +
		// 	`playing = false, ` +
		// 	`queued = false ` +
		// 	`WHERE game_session_id = ${gameId}`
		// );
		client.query(
			`UPDATE public.game_leaflet ` +
				`SET game_is_active = false ` +
				`WHERE game_session_id = ${gameId}`
		);
		client.query(
			`UPDATE public.game_leaflet ` +
				`SET playing = false, ` +
				`queued = false ` +
				`WHERE game_session_id = ${gameId}`
		);
		bot.channels.fetch(`${textChannelId.rows}`).then((results) => {
			gameChannel = results;
			gameChannel.send(
				`\n\u200b\n\u200bType **!Bands**, **!College Courses**, ` +
					`**!Companies**, **!Food Trucks**, **!Movies**, **!Organizations**, or ` +
					`**!Products** to choose your theme.`
			);
		});
	} catch (err) {
		console.log(err.stack);
		dmError(err);
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
				redCount +=
					bot.diceData[diceId[i]].sides[diceSide[0]].color_value;
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

// async function roll_for_game(message) {
function roll_for_game(message) {
	console.log(`start roll_for_game()`);
	// const client = await pool.connect();
	(async () => {
		const client = await pool.connect();
		try {
			await queuedPlayerUpdate(message);
			const gameLeafletData = await client.query(
				`SELECT * ` +
					`FROM public.game_leaflet ` +
					`WHERE player_id = ${message.member.id} ` +
					`AND game_is_active = true `
			);
			console.log(`gameLeafletData = ${JSON.stringify(gameLeafletData)}`);
			// console.log(`gameLeafletData.rows = ${gameLeafletData.rows}`);
			gameLeafletData.rows.forEach((row) => {
				gameSessionId = row.game_session_id;
				gameIsActive = row.game_is_active;
				leftGame = row.left_game;
				turnsAsActivePlayer = row.turns_as_active_player;
				themeCategory = row.theme_category_roll;
				titleJudge = row.title_judge_roll;
				taglineJudge = row.tagline_judge_roll;
			});
			if (leftGame == true) {
				message.channel.send(
					`${message.member}, use the **!play** command to re-join the game.`
				);
				return;
			}
			let winningTitle;
			console.log(`gameSessionId = ${gameSessionId}`);
			// console.log(`turnsAsActivePlayer = ${turnsAsActivePlayer}`);
			if (turnsAsActivePlayer >= 2) {
				//limits player to 2 turns
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
					text:
						`SELECT title_tagline ` +
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
				text:
					`SELECT game_theme ` +
					`FROM public.games ` +
					`WHERE text_channel_id = ${message.channel.id} ` +
					`AND game_is_active = true ` +
					`ORDER BY message_timestamp DESC LIMIT 1;`,
			});
			let gameThemeRows = gameTheme.rows;
			let themeCategoryText =
				bot.leafletData[gameThemeRows]["category"][themeCategory];
			let titleJudge1 =
				bot.leafletData[gameThemeRows]["judge1"][titleJudge];
			let titleJudge2 =
				bot.leafletData[gameThemeRows]["judge2"][titleJudge];
			let taglineJudge1 = bot.leafletData["round2"]["r2j1"][taglineJudge];
			let taglineJudge2 = bot.leafletData["round2"]["r2j2"][taglineJudge];
			message.channel.send(`${gameThemeRows}: **${themeCategoryText}**`);
			if (turnsAsActivePlayer == 2) {
				message.channel.send(`Winning Title: **${winningTitle}**`);
			}
			message.channel.send(`${message.member}: **ACTIVE PLAYER**`);

			let playersFromDatabaseArray = [];
			const guildIdFromDatabase = await client.query({
				rowMode: "array",
				text:
					`SELECT guild_id ` +
					`FROM public.games ` +
					`WHERE text_channel_id = ${message.channel.id} ` +
					`AND game_is_active = true ` +
					`ORDER BY message_timestamp DESC LIMIT 1;`,
			});
			const playersFromDatabase = await client.query(
				`SELECT * ` +
					`FROM public.game_leaflet ` +
					`WHERE text_channel_id = ${message.channel.id} ` +
					`AND game_is_active = true ` +
					`AND playing = true ` +
					`AND left_game = false`
			);
			playersFromDatabase.rows.forEach((row) => {
				playersInGame = row.player_id;
				guildId = guildIdFromDatabase.rows;
				console.log(`playersInGame = ${playersInGame}`);
				playersFromDatabaseArray.push(
					message.guild.member(playersInGame)
				);
				console.log(
					`playersFromDatabaseArray = ${JSON.stringify(
						playersFromDatabaseArray
					)}`
				);
			});
			playersFromDatabaseArray.forEach(function (
				guildMember,
				guildMemberId
			) {
				console.log(
					`JSON.stringify(guildMember) = ${JSON.stringify(
						guildMember
					)}`
				);
				console.log(`guildMember = ${guildMember}`);
				console.log(`guildMember.id = ${guildMember.id}`);
				console.log(`message.member.id = ${message.member.id}`);
				console.log(`guildMember.userid = ${guildMember.userid}`);
				if (message.member.id == guildMember.id) {
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
			playersFromDatabaseArray.forEach(function (
				guildMember,
				guildMemberId
			) {
				if (message.member.id != guildMember.id) {
					let playersDice = rollDice();
					guildMember.send(
						`${gameThemeRows}: **${themeCategoryText}**`
					);
					if (turnsAsActivePlayer == 2) {
						guildMember.send(`Winning Title: **${winningTitle}**`);
					}
					guildMember.send(`${playersDice}`);
					(async () => {
						const client = await pool.connect();
						try {
							await getGameId(message).then((results) => {
								gameId = results;
							});
							const gameTheme = await client.query({
								rowMode: "array",
								text:
									`SELECT game_theme ` +
									`FROM public.games ` +
									`WHERE text_channel_id = ${message.channel.id} ` +
									`AND game_is_active = true ` +
									`ORDER BY message_timestamp DESC LIMIT 1;`,
							});
							console.log(`gameId = ${gameId}`);
							console.log(`gameTheme.rows = ${gameTheme.rows}`);

							const prepStmnt = {
								game_session_id: parseInt(gameId),
								game_is_active: true,
								turn_is_active: true,
								readable_timestamp: getTimeStamp(),
								message_timestamp: message.createdTimestamp,
								category_name: message.channel.parent.name,
								category_id: message.channel.parent.id,
								text_channel_id: message.channel.id,
								message_id: message.id,
								game_theme: gameTheme.rows.toString(),
								active_player_id: message.member.id,
								active_player_username: message.author.username,
								player_id: guildMember.id,
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
								`category_name, category_id, text_channel_id, ` +
								`message_id, game_theme, active_player_id, active_player_username, ` +
								`player_id, player_username, letters_given, title_tagline, ` +
								`title_tagline_is_submitted, point_earned) ` +
								`VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;
							const prepStmntValues = [
								prepStmnt.game_session_id,
								prepStmnt.game_is_active,
								prepStmnt.turn_is_active,
								prepStmnt.readable_timestamp,
								prepStmnt.message_timestamp,
								prepStmnt.category_name,
								prepStmnt.category_id,
								prepStmnt.text_channel_id,
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
						} catch (err) {
							dmError(err);
							await client.query("ROLLBACK");
							throw err;
						} finally {
							client.release();
						}
					})().catch((err) => {
						dmError(err);
						console.error(err.stack);
					});
				}
			});
		} catch (err) {
			dmError(err);
			await client.query("ROLLBACK");
			throw err;
		} finally {
			client.release();
		}
	})().catch((err) => {
		dmError(err);
		console.error(err.stack);
	});
}

async function score(gameId) {
	// (async () => {
	const client = await pool.connect();
	try {
		const gameLeafletData = await client.query(
			`SELECT * ` +
				`FROM public.game_leaflet ` +
				`WHERE game_session_id = ${gameId};`
		);
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
				if (row.left_game == false) {
					gameChannel.send(`<@${row.player_id}>: ${bananaScore}`);
				} else if (row.left_game == true) {
					gameChannel.send(
						`~~<@${row.player_id}>: ${bananaScore}~~ - player left game`
					);
				}
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
				if (row.left_game == false) {
					gameChannel.send(`<@${row.player_id}>: ${bananaScore}`);
				} else if (row.left_game == true) {
					gameChannel.send(
						`~~<@${row.player_id}>~~: ${bananaScore}  ::  player left game`
					);
				}
			});
		});
		// })().catch((err) => {
		// 	dmError(err);
		// 	console.error(err.stack);
		// });
		// }
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

async function sendToTextChannel(gameSessionID) {
	const client = await pool.connect();
	try {
		const playerCount = await client.query({
			rowMode: "array",
			text:
				`SELECT turns_id ` +
				`FROM public.turns ` +
				`WHERE game_session_id = ${gameSessionID} ` +
				`AND turn_is_active = true`,
		});
		console.log(`playerCount = ${playerCount.rows}`);
		console.log(`playerCount length = ${playerCount.rows.length}`);
		const activePlayer = await client.query({
			rowMode: "array",
			text:
				`SELECT active_player_id ` +
				`FROM public.turns ` +
				`WHERE game_session_id = ${gameSessionID} ` +
				`AND turn_is_active = true ` +
				`ORDER BY message_timestamp DESC LIMIT 1`,
		});
		const taglineCount = await client.query({
			rowMode: "array",
			text:
				`SELECT turns_id ` +
				`FROM public.turns ` +
				`WHERE game_session_id = ${gameSessionID} ` +
				`AND turn_is_active = true ` +
				`AND title_tagline_is_submitted = true `,
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
					.catch((err) => {
						dmError(err);
						console.error(err);
					});
				const allTaglines = await client.query(
					`SELECT * ` +
						`FROM public.turns ` +
						`WHERE game_session_id = ${gameSessionID} ` +
						`AND turn_is_active = true ` +
						`ORDER BY RANDOM()`
				);
				allTaglines.rows.forEach((row) => {
					bot.channels
						.fetch(`${row.text_channel_id}`)
						.then((results) => {
							gameChannel = results;
							console.log(`gameChannel = ${gameChannel}`);
							gameChannel.send(
								`${row.letters_given}: ${row.title_tagline}`
							);
						})
						.catch((err) => {
							dmError(err);
							console.error(err);
						});
				});
			}
		}
	} catch (err) {
		console.log(err.stack);
		dmError(err);
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
		// Situations:

		// 1. trying to start a game where there's already a game
		// 2. trying to start a game while in another game
		// 3. trying to start a game you're already in
		// 4. starting a game at an empty table while not in another game - normal

		// games: game_id, game_is_active
		// game_leaflet: game_session_id, game_is_active, player_id, queued, playing, left_game

		const prepGameStart = {
			game_is_active: true,
			readable_timestamp: getTimeStamp(),
			message_timestamp: message.createdTimestamp,
			guild_name: message.guild.name,
			guild_id: message.guild.id,
			category_name: message.channel.parent.name,
			category_id: message.channel.parent.id,
			text_channel_id: message.channel.id,
			message_id: message.id,
			game_theme: theme,
			theme_category_roll_array: shuffle(Array.from(Array(27).keys())),
			title_judge_roll_array: shuffle(Array.from(Array(27).keys())),
			tagline_judge_roll_array: shuffle(Array.from(Array(27).keys())),
			author_id: message.author.id,
			author_username: message.author.username,
		};
		await client.query("BEGIN");
		const insertGameStartText =
			`INSERT INTO public.games(game_is_active, readable_timestamp, message_timestamp, ` +
			`guild_name, guild_id, category_name, category_id, text_channel_id, ` +
			`message_id, game_theme, theme_category_roll_array, ` +
			`title_judge_roll_array, tagline_judge_roll_array, author_id, author_username) ` +
			`VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;
		const insertGameStartValues = [
			prepGameStart.game_is_active,
			prepGameStart.readable_timestamp,
			prepGameStart.message_timestamp,
			prepGameStart.guild_name,
			prepGameStart.guild_id,
			prepGameStart.category_name,
			prepGameStart.category_id,
			prepGameStart.text_channel_id,
			prepGameStart.message_id,
			prepGameStart.game_theme,
			prepGameStart.theme_category_roll_array,
			prepGameStart.title_judge_roll_array,
			prepGameStart.tagline_judge_roll_array,
			prepGameStart.author_id,
			prepGameStart.author_username,
		];
		await client.query(insertGameStartText, insertGameStartValues);
		await client.query("COMMIT");

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
				`  **!score** - displays current scores.\n\u200b` +
				`  **!help** - full list of commands.\n\u200b`
		);
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

function themeFormat(message) {
	let theme = lowerCase(message.content)
		.substring(PREFIX.length)
		.split(/ +/g);
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
			text:
				`SELECT title_tagline_is_submitted ` +
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
				`AND message_timestamp = (SELECT MAX(message_timestamp) from public.turns);`
		);
		const lettersGiven = await client.query({
			rowMode: "array",
			text:
				`SELECT letters_given ` +
				`FROM public.turns ` +
				`WHERE title_tagline = $$${titleTagline}$$ ` +
				`AND turn_is_active = true LIMIT 1;`,
		});

		await client.query(
			`UPDATE public.turns ` +
				`SET dice_and_tagline = $$${lettersGiven.rows}: ${titleTagline}$$ ` +
				`WHERE player_id = ${message.author.id} ` +
				`AND turn_is_active = true ` +
				`AND message_timestamp = (SELECT MAX(message_timestamp) from public.turns);`
		);
		await client.query(
			`UPDATE public.turns ` +
				`SET title_tagline_is_submitted = true ` +
				`WHERE player_id = ${message.author.id} ` +
				`AND title_tagline_is_submitted = false;`
		);
		const gameSessionID = await client.query({
			rowMode: "array",
			text:
				`SELECT game_session_id ` +
				`FROM public.turns ` +
				`WHERE title_tagline = $$${titleTagline}$$ ` +
				`ORDER BY message_timestamp DESC LIMIT 1;`,
		});
		await sendToTextChannel(gameSessionID.rows);
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

function trace(x) {
	console.trace(x);
}

async function turnIsInProgress(message) {
	const client = await pool.connect();
	try {
		const gameId = await client.query({
			rowMode: "array",
			text:
				`SELECT game_id ` +
				`FROM public.games ` +
				`WHERE category_id = ${message.channel.parent.id} ` +
				`AND game_is_active = true ` +
				`ORDER BY message_timestamp DESC LIMIT 1;`,
		});
		let activeGameId = gameId.rows;
		const gameIdInTurns = await client.query({
			rowMode: "array",
			text:
				`SELECT game_session_id ` +
				`FROM public.turns ` +
				`WHERE game_session_id = ${activeGameId} ` +
				`AND turn_is_active = true ` +
				`ORDER BY message_timestamp DESC LIMIT 1;`,
		});
		if (gameIdInTurns.rows.length === 0) {
			return false;
		} else {
			console.log(`turnIsInProgress message.member = ${message.member}`);
			const result = await client.query({
				rowMode: "array",
				text:
					`SELECT turns_id ` +
					`FROM public.turns ` +
					`WHERE text_channel_id = ${message.channel.id} ` +
					`AND turn_is_active = true ` +
					`AND point_earned = 1 ` +
					`ORDER BY message_timestamp DESC LIMIT 1;`,
			});
			console.log(`turnIsInProgress result.rows = ${result.rows}`);
			console.log(
				`turnIsInProgress result.rows.length = ${result.rows.length}`
			);
			if (result.rows.length === 1) {
				return false;
			}
			if (result.rows.length === 0) {
				return true;
			}
		}
	} catch (err) {
		console.log(err.stack);
		dmError(err);
		throw err;
	} finally {
		client.release();
	}
}

async function updateStatus() {
	var watchPlay = [0, 1, 2, 3, 4];
	shuffle(watchPlay);
	if (watchPlay[0] == 0 || watchPlay[0] == 1) {
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
			"Rumble in the Jungle",
			"Bananagrams",
			"Santorini",
			"Santorini: New York",
			"Dice Throne",
			"Dice Throne Adventures",
			"Steampunk Rally",
			"Steampunk Rally Fusion",
			"Super Motherload",
			"Brass: Birmingham",
			"Brass: Lancashire",
			"SKYRISE",
			"Santorini App",
			"with a coconut",
			"Win, Lose, Or Banana",
			"Tiny Epic Apes",
			"One Night Ultimate Were-ape",
			"Hey, That's My Banana!",
			"Dominant Species",
			"Evolution",
			"Castles of Mad King Kong",
			"Zooloretto",
			"A Few Acres of Jungle",
			"without a full deck",
			"for keeps",
			"with fire",
			"devil's advocate",
			"in traffic",
			"bongos",
			"Fruit Ninja",
			"Super Monkey Ball",
			"Ape Escape",
			"Ape Out",
			"Dissection: Murder By King Kong",
			"Monkey Island",
			"that funky music, white boy",
			"games with your heart",
		];
		shuffle(statusArray);
		bot.user
			.setActivity(statusArray[0], {
				type: "PLAYING",
			})
			.then((presence) =>
				console.log(`Playing ${presence.activities[0].name}`)
			)
			.catch((err) => {
				dmError(err);
				console.error(err);
			});
	} else if (watchPlay[0] == 2 || watchPlay[0] == 3) {
		var statusArray = [
			"King Kong",
			"Congo",
			"Planet of the Apes",
			"Gorillas in the Mist",
			"Kong: Skull Island",
			"Tarzan",
			"The One and Only Ivan",
			"George of the Jungle",
			"Mighty Joe Young",
			"Bride of the Gorilla",
			"Queen Kong",
			"Son of Kong",
			"Magilla Gorilla",
			"Curious George",
			"The Jungle Book",
			"Bananas In Pyjamas",
			"12 Monkeys",
			"Zoboomafoo",
			"Swingers",
			"Space Chimps",
			"Dora The Explorer",
			"Family Guy",
			"his weight",
			"his language",
			"the clock",
			"paint dry",
			"the watchers",
			"a very slow progress bar",
			"Animal Planet",
		];
		shuffle(statusArray);
		bot.user
			.setActivity(statusArray[0], {
				type: "WATCHING",
			})
			.then((presence) =>
				console.log(`Watching ${presence.activities[0].name}`)
			)
			.catch((err) => {
				dmError(err);
				console.error(err);
			});
	} else if (watchPlay[0] == 4) {
		var statusArray = [
			"Monkey, by George Michael",
			"Brass Monkey, by the Beastie Boys",
			"Peter Gabriel - Shock The Monkey",
			"Monkey Wrench, by the Foo Fighters",
			"The Monkees - Daydream Believer",
			"Monkey Man, by the Rolling Stones",
			"Copa Banana, by Barry Manilow",
			"Gorillaz - Rock The House feat. Del The Funky Homosapien",
			"My Brother The Ape, by They Might Be Giants",
			"Bananarama - Venus",
			"Love Monkey #9, by Bootsauce",
			"Arctic Monkeys - I Bet You Look Good On The Dancefloor",
			"Tarzan Boy, by Baltimora",
			"Jungle Love, by the Steve Miller Band",
			"Welcome To The Jungle, by Guns N' Roses",
			"Jungle Love, by Morris Day and The Time",
			"Bananaphone, by Raffi",
			"Yes, We Have No Bananas, by Louis Prima",
			"Banana Boat Song (Day-O), by Harry Belafonte",
			"Space Monkey, by John Prine",
			"Tweeter and the Monkey Man, by the Traveling Wilburys",
			"99 Red Baboons, by Nena",
			"Code Monkey, by Jonathan Coulton",
		];
		shuffle(statusArray);
		bot.user
			.setActivity(`${statusArray[0]}`, {
				type: "LISTENING",
			})
			.then((presence) =>
				console.log(`Listening to ${presence.activities[0].name}`)
			)
			.catch((err) => {
				dmError(err);
				console.error(err);
			});
	}
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
		await client.query(
			insertMessageArchiveText,
			insertMessageArchiveValues
		);
		await client.query("COMMIT");
	} catch (err) {
		console.log(err.stack);
		dmError(err);
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
		dmError(err);
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}
// Super Secret Token!!!
bot.login(config.token);
