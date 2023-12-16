import levenshtein from "fast-levenshtein";
import { readFileSync, writeFileSync } from "fs";

import { isQuestion } from "./nlp.js";
import { imgToText } from "./ocr.js";
import { startBot } from "./bot.js";

const DB = "db.json";

const compare = (a, b) => {
    return levenshtein.get(a, b);
}

// the only real db, a map that gets stringified to json
let db = {};

const loadDB = () => db = JSON.parse(readFileSync(DB));
loadDB();

const checkDB = (channelID, query) => {
    return Object.entries(db[channelID] || {})
        .sort((a, b) => compare(query, a[1]) - compare(query, b[1]))
        .map(el => ({msgID: el[0], msg: el[1], distance: compare(query, el[1])}))
        .filter(el => el.distance < 50)
        .slice(0, 3)
}

export const saveDB = () => writeFileSync(DB, JSON.stringify(db));
// save cache every 5 minutes. hope this doesn't bite me in the butt
setInterval(saveDB, 1000 * 60 * 5);
setTimeout(saveDB, 1000 * 30);

const addToDB = (channelID, msgID, msg) => {
    // cool trick
    db = {...db, [channelID]: {...db[channelID], [msgID]: msg}}
}

// new message comes in, we return a possibly empty list of relevant messages to suggest
// algorithm:
//  -> if the message is not a question and there is no attached image, return nothing
//  -> if there is an image, consider the optical text rather than the message
//  -> add the final message to the cache
//  -> return the top 2 results
export const getResponse = async (channelID, msgID, msg, img) => {
    if (!isQuestion(msg) && !img) return [];
    if (img) msg = await imgToText(img);

    // Logging, ignore performance and elegance here.
    // if (isQuestion(msg)) console.log(chalk.green("Question:"), msg);
    // if (!img) console.log(chalk.blue("Image:"), img);

    let temp = checkDB(channelID, msg);
    addToDB(channelID, msgID, msg);
    return temp;
};

startBot(getResponse, db);
