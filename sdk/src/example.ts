import { Think } from ".";

const agent = new Think("Simple Time Agent", {
    systemPrompt: "You help the user",
    tools: [
        'https://api.think.new/scp/time',
    ],
    baseUrl: 'http://localhost:1234/api'
});


async function run() {
    await agent.sendMessage("What is the time?");
    const messages = await agent.getMessages();
    console.log(messages);
}

run().then(() => {
    console.log("done")
}).catch((e) => {
    console.error(e)
})