const config = require("./config.json");
var dbCreds = require('./dbCreds.js');
const { Pool } = require('pg');
const pool = new Pool(dbCreds);

async function createSchemaIfNotExist() {
    ;
    (async () => {
        const client = await pool.connect()
        try {
            console.log(`creating tables`);

            await client.query(`CREATE SCHEMA IF NOT EXISTS gorilla_schema`)

            await client.query(`CREATE TABLE IF NOT EXISTS gorilla_schema.games
            (
                game_id SERIAL NOT NULL,
                game_is_active boolean NOT NULL,
                readable_timestamp character varying(30) COLLATE pg_catalog."default",
                message_timestamp bigint,
                guild_name character varying(32) COLLATE pg_catalog."default",
                guild_id bigint,
                category_name character varying(32) COLLATE pg_catalog."default",
                category_id bigint,
                text_channel_id bigint,
                message_id bigint,
                game_theme character varying(32) COLLATE pg_catalog."default",
                theme_category_roll_array integer[],
			    title_judge_roll_array integer[],
			    tagline_judge_roll_array integer[],
                author_id bigint,
                author_username character varying(32) COLLATE pg_catalog."default",
                waiting_for_responses_message_id bigint,
                CONSTRAINT game_id_pkey PRIMARY KEY (game_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            ALTER TABLE gorilla_schema.games
                OWNER to ${config.connUser};`)

            await client.query(`CREATE TABLE IF NOT EXISTS gorilla_schema.turns
            (
                turns_id SERIAL NOT NULL,
                game_session_id int,
                game_is_active boolean,
                turn_is_active boolean,
                readable_timestamp character varying(30) COLLATE pg_catalog."default",
                message_timestamp bigint,
                category_name character varying(32) COLLATE pg_catalog."default",
                category_id bigint,
                text_channel_id bigint,
                message_id bigint,
                game_theme character varying(32) COLLATE pg_catalog."default",
                active_player_id bigint,
                active_player_username character varying(32) COLLATE pg_catalog."default",
                player_id bigint,
                player_username character varying(32) COLLATE pg_catalog."default",
                letters_given character varying(250) COLLATE pg_catalog."default",
                title_tagline character varying(250) COLLATE pg_catalog."default",
                title_tagline_is_submitted boolean NOT NULL,
                point_earned int,
                dice_and_tagline character varying(500) COLLATE pg_catalog."default",
                CONSTRAINT turns_id_pkey PRIMARY KEY (turns_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            ALTER TABLE gorilla_schema.turns
                OWNER to ${config.connUser};`)

            await client.query(`CREATE TABLE IF NOT EXISTS gorilla_schema.game_leaflet 
            (
                game_leaflet_id SERIAL NOT NULL,
                game_session_id int,
                game_is_active boolean,
                player_id bigint,
                queued boolean NOT NULL,
                playing boolean NOT NULL,
                left_game boolean NOT NULL,
                turns_as_active_player int,
                theme_category_roll int,
                title_judge_roll int,
                title_judge_choice character varying(64) COLLATE pg_catalog."default",
                tagline_judge_roll int,
                tagline_judge_choice character varying(64) COLLATE pg_catalog."default",
                total_points int,
                category_id bigint,
                text_channel_id bigint,
                CONSTRAINT game_leaflet_id_pkey PRIMARY KEY (game_leaflet_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            ALTER TABLE gorilla_schema.game_leaflet
                OWNER to ${config.connUser};`)

            await client.query(`CREATE TABLE IF NOT EXISTS gorilla_schema.dm_archive
            (
                dm_archive_id SERIAL NOT NULL,
                readable_timestamp character varying COLLATE pg_catalog."default",
                author_username character varying COLLATE pg_catalog."default",
                author_id bigint,
                message_timestamp bigint,
                message_content character varying COLLATE pg_catalog."default",
                CONSTRAINT dm_archive_pkey PRIMARY KEY (dm_archive_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;            
            ALTER TABLE gorilla_schema.dm_archive
                OWNER to ${config.connUser};`)

            await client.query(`CREATE TABLE IF NOT EXISTS gorilla_schema.message_archive
            (
                messagearchive_id SERIAL NOT NULL,
                readable_timestamp character varying(30) COLLATE pg_catalog."default",
                guild_name character varying(32) COLLATE pg_catalog."default",
                guild_id bigint,
                channel_name character varying(32) COLLATE pg_catalog."default",
                channel_id bigint,
                message_id bigint,
                author_id bigint,
                author_username character varying(32) COLLATE pg_catalog."default",
                member_nickname character varying(32) COLLATE pg_catalog."default",
                message_timestamp bigint,
                message_content character varying(2000) COLLATE pg_catalog."default",
                CONSTRAINT message_archive_pkey PRIMARY KEY (messagearchive_id)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;            
            ALTER TABLE gorilla_schema.message_archive
                OWNER to ${config.connUser};`)


        } catch (e) {
            await client.query('ROLLBACK')
            console.log(e)
        } finally {
            // Make sure to release the client before any error handling,
            // just in case the error handling itself throws an error.
            client.release()
        }
    })().catch(err => console.log(err.stack))
}

module.exports = createSchemaIfNotExist();