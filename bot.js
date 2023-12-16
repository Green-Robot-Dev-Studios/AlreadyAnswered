import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";

import { saveDB } from './index.js'

const TOKEN = process?.env.BOT_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildIntegrations,
    ],
});

async function getMessages(channel, limit = 10000) {
    const sum_messages = [];
    let last_id;

    let messages = [];
    let emergency = 0;
    while (sum_messages.length <= limit && emergency < 200) {
        emergency++;

        const options = { limit: 100 };
        if (last_id) {
            options.before = last_id;
        }

        messages = await channel.messages.fetch(options);
        console.log(messages)
        sum_messages.push(...Array.from(messages.values()));
        last_id = messages.last().id;
        console.log(sum_messages.length)
        if (Array.from(messages.values()).length !== 100) break;
    }
    console.log(`TOOK ${emergency} CALLS TO API`)
    return sum_messages;
}

const getSimilar = async (message, callback) => {
    let image = false;
    if (
        message.attachments &&
        message.attachments.size > 0 &&
        message.attachments.at(0).url &&
        message.attachments.at(0).contentType.startsWith("image")
    ) {
        image = message.attachments.at(0).url;
    }
    return await callback(message.channelId, message.url, message.content, image);
}

export const startBot = async (callback, db) => {
    client.once(Events.ClientReady, (readyClient) => {
        console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    client.on(Events.MessageCreate, async (message) => {
        // console.log(db.channels, message.channelId)
        if (!db.channels.includes(message.channelId)) return;
        
        let similar = await getSimilar(message, callback)
        console.log(similar)
        if (similar && similar.length > 0) {
            let reply = await message.reply({ content: 
                `Found ${similar.length} similar questions.\n`.concat(...similar.map(el => `${el.msgID}\n`))
            });

            await reply.react("👍");
            await reply.react("👎");
            const collectorFilter = (reaction) => {
                return ["👍", "👎"].includes(reaction.emoji.name);
            };

            const collector = reply.createReactionCollector({
                filter: collectorFilter,
                time: 120000,
            });

            collector.on("collect", async (reaction) => {
                // missing perms. too lazy.
                // if (reaction.emoji.name == "👍") [react1, react2].forEach(r => r.remove());
                if (reaction.emoji.name == "👎") await reply.delete();
            });
        }
    });

    client.login(TOKEN);


    const rest = new REST().setToken(TOKEN);
    const commands = [
        {
            name: "enable",
            description: "Enable Answer Bot For This Channel",
            default_member_permissions: "0",
        },
    ];

    // These numbers ain't private, don't worry.
    await rest.put(
        Routes.applicationGuildCommands(
            "1185482764242399282",
            "869951873749254225" // Bot testing
        ),
        { body: commands }
    );
    await rest.put(
        Routes.applicationGuildCommands(
            "1185482764242399282",
            "957695442915835945" // UW
        ),
        { body: commands }
    );

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.commandName == "enable") {
            interaction.reply("Enabling this channel!")
            if (!db.channels.includes(interaction.channelId)) db.channels.push(interaction.channelId);

            let messages = await getMessages(interaction.channel, 1000);
            for (let message of messages.values()) {
                console.log("Adding", message.id)
                await getSimilar(message, callback);
            }
            saveDB();
            await interaction.channel.send("Done!");
        }
    });
};

export const getOldMessages = () => 0;
