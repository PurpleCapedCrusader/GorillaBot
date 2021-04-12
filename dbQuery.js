// const config = require("./config.json");
// var dbCreds = require('./dbCreds.js');
// const { Pool } = require('pg');
// const pool = new Pool(dbCreds);

// const playerCount = await client.query({
//     rowMode: "array",
//     text: `SELECT turns_id ` +
//         `FROM gorilla_schema.turns ` +
//         `WHERE game_session_id = ${gameSessionID} ` +
//         `AND turn_is_active = true`,
// });

// const activePlayer = await client.query({
//     rowMode: "array",
//     text:
//         `SELECT active_player_id ` +
//         `FROM gorilla_schema.turns ` +
//         `WHERE game_session_id = ${gameSessionID} ` +
//         `AND turn_is_active = true ` +
//         `ORDER BY message_timestamp DESC LIMIT 1`,
// });

// const taglineCount = await client.query({
//     rowMode: "array",
//     text:
//         `SELECT turns_id ` +
//         `FROM gorilla_schema.turns ` +
//         `WHERE game_session_id = ${gameSessionID} ` +
//         `AND turn_is_active = true ` +
//         `AND title_tagline_is_submitted = true `,
// });

// const gameLeafletData = await client.query(
//     `SELECT * ` +
//         `FROM gorilla_schema.game_leaflet ` +
//         `WHERE player_id = ${activePlayer.rows} ` +
//         `AND game_session_id = ${gameSessionID}`
// );

// module.exports = {
//     playerCount: playerCount,
//     activePlayer: activePlayer,
//     taglineCount: taglineCount,
//     gameLeafletData: gameLeafletData
// }