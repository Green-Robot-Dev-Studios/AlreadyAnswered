// welp, we did it folks, NLP is no more with the help of one simple function
export const isQuestion = (string) => {
    if (!string) return false;
    // console.log("string", string)

    const parsedString = string.toLowerCase().trim().replace(/'|,/g, "");
    const words = parsedString.split(" ");
    const inquisitiveWords = [
        "what",
        "which",
        "are",
        "am",
        "were",
        "might",
        "can",
        "could",
        "will",
        "shall",
        "would",
        "should",
        "who",
        "has",
        "have",
        "had",
        "did",
        "in",
        "at",
        "to",
        "from",
        "on",
        "under",
        "over",
    ];
    return (
        inquisitiveWords.some((word) => words.includes(word)) ||
        parsedString.includes("?")
    );
};
