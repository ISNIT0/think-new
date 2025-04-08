import { Think } from ".";

const agent = new Think("Simple Add Agent", {
    systemPrompt: "A simple agent that adds two numbers",
    tools: [
        'https://api.think.new/scp/add',
    ],
});


async function run() {
    await agent.sendMessage("Add 5 and 2");
    const messages = await agent.getMessages();
    console.log(messages);
}

run().then(() => {
    console.log("done")
}).catch((e) => {
    console.error(e)
})