const Discord = require('discord.js');
// const express = require('express');
const config = require("./config.json");
var dbCreds = require('./dbCreds.js');
var lowerCase = require('lower-case');
var check = require('check-types');
const databaseCheck = require('./databaseBuilder.js');
const fs = require("fs");
const bot = new Discord.Client();
const PREFIX = config.prefix;
const {Pool} = require('pg');
const pool = new Pool(dbCreds);

var dice1 = "";
var dice2 = "";
var dice3 = "";
var dice4 = "";
var dice5 = "";
var dice6 = "";
var dice7 = "";
var dice8 = "";

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

// JOIN ME ONLINE Interval check
setInterval(function () {
    // console.log("running removeTempOnlineRole at " + GetTimeStamp());
    // removeTempOnlineRole()
}, 60000); // 86400000 = 1day, 3600000 = 1hr, 60000 = 1min

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

// Add God Role (remove old god role if exists)
    // if (message.content.slice(0, 4).toLowerCase() === '!iam') {
    //     if (message.channel.name === 'eris-bot') {
    //         let lastLetter = message.content.length;
    //         let roleRequested = message.content.slice(4, lastLetter).toLowerCase();
    //         // console.log(roleRequested + " " + GetTimeStamp());

    //         if (roleRequested.slice(0, 6) === 'castor') {
    //             roleRequested = 'castor & pollux';
    //         };

    //         if (roleRequested.slice(0, 6) === 'europa') {
    //             roleRequested = 'europa & talus';
    //         };

    //         if (message.guild.roles.cache.some(r => roleRequested.includes(r.name))) {
    //             if (message.member.roles.cache.some(r => roleRequested.includes(r.name))) { // has one of the roles
    //                 // console.log(message.guild.roles);
    //                 // console.log(message.member.roles);
    //                 let member = message.member;
    //                 const getGodRole = member.roles.cache.find(role => roleRequested.includes(role.name)); //get name of current God Role
    //                 member.roles.remove(getGodRole).catch(console.error);
    //                 // console.log('role removed' + GetTimeStamp());
    //                 message.channel.send(message.author.username + " has left the " + roleRequested + " role group.")
    //             } else {
    //                 let member = message.member;
    //                 const getGodRole = message.guild.roles.cache.find(role => roleRequested.includes(role.name));
    //                 member.roles.add(getGodRole).catch(console.error);
    //                 // console.log('Role added' + GetTimeStamp());
    //                 message.channel.send(message.author.username + " has joined the " + roleRequested + " role group.")
    //             }
    //         } else {
    //             message.channel.send(roleRequested + " isn\'t a role. Please check the spelling and try again.")
    //         }
    //     } else {
    //         message.channel.send("Head over to the #eris-bot channel for role updates.")
    //         // console.log('tried to change role from wrong channel');
    //     }
    // };

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
            message.channel.send(`That command only works in the #eris-bot channel.`)
        }
    };

    let args = message.content.substring(PREFIX.length).split(/ +/g);
    // console.log ("args = " + args);
    // console.log(`${message.author.username} ${message.author.discriminator} id = ${message.author.id} looked up ${args} #${godArray.indexOf(lowerCase(args[0]))} - ${GetTimeStamp()}`);
        
        
    args[0] = lowerCase(args[0]);
    switch (args[0]) {

        case 'roll':
            var diceArray = [1, 2, 3, 4, 5, 6, 7, 8];
            shuffle(diceArray);
            console.log(`diceArray = ${diceArray}`);
            
            // dice = (Math.floor(Math.random() * 6) + 1);
                
            console.log(`dice1 = ${diceArray[0]}`);
            console.log(`dice2 = ${diceArray[1]}`);
            console.log(`dice3 = ${diceArray[2]}`);
            console.log(`dice4 = ${diceArray[3]}`);
            console.log(`dice5 = ${diceArray[4]}`);
            console.log(`dice6 = ${diceArray[5]}`);
            console.log(`dice7 = ${diceArray[6]}`);
            console.log(`dice8 = ${diceArray[7]}`);
            break;

        case 'test':
            console.log("test");
            break;
    }
});

// GOD INFO - MUST GO LAST BECAUSE IT TAKES ALL CASES
        //     case (args[0]):
        //         var arrayLength = godArray.length;
        //         for (var i = 0; i < arrayLength; i++) {
        //             //console.log(godArray[i]);
        //             if (godArray[i] == (lowerCase(args[0]))) {
        //                 var godSearched = godArray.indexOf(lowerCase(args[0]));
        //                 //console.log("godSearched = " + godSearched);
        //                 // console.log("args[1] = " + args[1]);
        //                 if (bot.godData[godSearched].update == "Updated") {
        //                     const embed = new Discord.MessageEmbed()
        //                         .attachFiles(['../ErisBot/images/' + (bot.godData[godSearched].imageName) + '.jpg'])
        //                         .setColor("0x" + bot.godData[godSearched].borderColor)
        //                         .addField(bot.godData[godSearched].name, bot.godData[godSearched].title + "\n\u200b")
        //                         .addField('Ability(updated):', bot.godData[godSearched].updatedAbilityFormatted + "\n\u200b")
        //                         .addField('Ability(original):', bot.godData[godSearched].originalAbilityFormatted + "\n\u200b")
        //                         .addField('Banned Opponents:', bot.godData[godSearched].banned + "\n\u200b")
        //                         .addField('Character Category:', bot.godData[godSearched].group + "\n\u200b")
        //                         .addField('App Availability:', bot.godData[godSearched].inAppPurchase + "\n\u200b")
        //                         .addField('Compatible with', bot.godData[godSearched].compatability)
        //                         .setThumbnail('attachment://' + (bot.godData[godSearched].imageName) + '.jpg');
        //                     message.channel.send(embed).catch(console.error);
        //                     break;
        //                 } else if (bot.godData[godSearched].update == "Same") {
        //                     const embed = new Discord.MessageEmbed()
        //                         .attachFiles(['../ErisBot/images/' + (bot.godData[godSearched].imageName) + '.jpg'])
        //                         .setColor("0x" + bot.godData[godSearched].borderColor)
        //                         .addField(bot.godData[godSearched].name, bot.godData[godSearched].title + "\n\u200b")
        //                         .addField('Ability:', bot.godData[godSearched].originalAbilityFormatted + "\n\u200b")
        //                         .addField('Banned Opponents:', bot.godData[godSearched].banned + "\n\u200b")
        //                         .addField('Character Category:', bot.godData[godSearched].group + "\n\u200b")
        //                         .addField('App Availability:', bot.godData[godSearched].inAppPurchase + "\n\u200b")
        //                         .addField('Compatible with', bot.godData[godSearched].compatability)
        //                         .setThumbnail('attachment://' + (bot.godData[godSearched].imageName) + '.jpg');
        //                     message.channel.send(embed).catch(console.error);
        //                     break;
        //                 } else {
        //                     break;
        //                 }
        //             }
        //         }
        // // }


function GetTimeStamp() {
    let now = new Date();
    return "[" + now.toLocaleString() + "]";
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
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

// async function removeTempOnlineRole() {
//     ;
//     (async () => {
//         const client = await pool.connect()
//         try {
//             let currentTime = Date.now()
//             const query = await client.query(`SELECT * FROM public.online_role_tracking WHERE remove_time < ${currentTime} AND status = true`)
//             query.rows.forEach(row => { 
//                 let member = bot.guilds.cache.get(row.guild_id).member(row.author_id);
//                 let role_id = bot.guilds.cache.get(row.guild_id).roles.cache.find(rName => rName.id === row.temp_role_id);
//                 // console.log("role_id = " + role_id);
//                 // console.log("member = " + member);
//                 member.roles.remove(role_id).catch(console.error);
//                 client.query(`UPDATE public.online_role_tracking SET status = false WHERE onlineroletracking_id = ${row.onlineroletracking_id}`)
//                 console.log(`${row.author_username} was removed from the ${row.temp_role} role group in the ${row.guild_name} channel.`);
//             })
//         } catch (e) {
//             await client.query('ROLLBACK')
//             throw e
//         } finally {
//             client.release()
//         }
//     })().catch(err => console.log(err.stack))
// }

// async function setTempOnlineRole(durationRequested, message, roleRequested) {
//     ;
//     (async () => {
//         const client = await pool.connect()
//         try {
//             let temp_role_id = await message.guild.roles.cache.find(role => role.name === roleRequested).id;
//             let timeOfRequest = Date.now()
//             const onlineRequest = {
//                 'guild_name': message.guild.name,
//                 'guild_id': message.guild.id,
//                 'channel_name': message.channel.name,
//                 'channel_id': message.channel.id,
//                 'message_id': message.id,
//                 'author_username': message.author.username,
//                 'author_id': message.author.id,
//                 'member_nickname': message.member.nickname,
//                 'readable_timestamp': GetTimeStamp(),
//                 'start_time': timeOfRequest,
//                 'duration_requested': durationRequested,
//                 'remove_time': timeOfRequest + (durationRequested * 60000),
//                 'status': 1
//             }
//             await client.query('BEGIN')
//             const insertTempRoleRequestText = 'INSERT INTO public.online_role_tracking(guild_name, guild_id, channel_name, channel_id, message_id, author_username, author_id, member_nickname, temp_role, temp_role_id, readable_timestamp, start_time, duration_requested, remove_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)'
//             const insertTempRoleRequestValues = [onlineRequest.guild_name, onlineRequest.guild_id, onlineRequest.channel_name, onlineRequest.channel_id, onlineRequest.message_id, onlineRequest.author_username, onlineRequest.author_id, onlineRequest.member_nickname, roleRequested, temp_role_id, onlineRequest.readable_timestamp, onlineRequest.start_time, onlineRequest.duration_requested, onlineRequest.remove_time, onlineRequest.status]
//             await client.query(insertTempRoleRequestText, insertTempRoleRequestValues)
//             await client.query('COMMIT')
//             const getGodRole = message.guild.roles.cache.find(role => roleRequested.includes(role.name));
//             // console.log("getGodRole = " + getGodRole);
//             message.member.roles.add(getGodRole).catch(console.error);
//             // TODO update online time if not false
//             // console.log(`guild size = ${message.guild.members.cache.size}`)
//             if (roleRequested == "Join Me Online") {
//                 let online_notify_role_id = await message.guild.roles.cache.find(role => role.name === "Online Notify").id;
//                 let membersWithRole = message.guild.roles.cache.get(online_notify_role_id).members.map(m => m.user);
//                 // console.log(`membersWithRole = ${membersWithRole}`)
//                 await membersWithRole.forEach((member) => {
//                     console.log(`member.username = ${member.username}`)
//                     // console.log(`member.id = ${member.id}`)
//                     // console.log(`message.member.id = ${message.author.id}`)
//                     // console.log(`nickname = ${message.member.nickname}`)
//                     if (member.id == message.author.id) {
//                             member.send(`I told everyone in the Online Notify group that you are available for the next ${onlineRequest.duration_requested} min.`)
//                     }
//                     if (member.id != message.author.id) {
//                         if (message.member.nickname != null) {
//                             // console.log(`message.member.nickname = ${message.member.nickname}`)
//                             member.send(`${message.member.nickname} is playing Santorini online for the next ${onlineRequest.duration_requested} min. If you want me to stop sending you these updates, use the !notifyOFF command.`)
//                         } else {
//                             // console.log(`message.member.username = ${message.author.username}`)
//                             member.send(`${onlineRequest.author_username} is playing Santorini online for the next ${onlineRequest.duration_requested} min. If you want me to stop sending you these updates, use the !notifyOFF command.`)
//                         }
//                     }
//                 });
//                 // await message.member.send(`I've added you to the Online Notify group. I'll send you a DM when someone uses the !online command.  playing Santorini online for the next ${onlineRequest.duration_requested} min.`).catch(console.error);
//                 let role = await message.guild.roles.cache.find(r => r.name === "Online Notify");
//                 await message.member.roles.add(role).catch(console.error);
//             }
//         } catch (e) {
//             await client.query('ROLLBACK')
//             throw e
//         } finally {
//             client.release()
//         }
//     })().catch(err => console.log(err.stack))
// }

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