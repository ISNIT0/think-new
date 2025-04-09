import { Think } from ".";

async function run() {
    const agent = new Think("Simple Time Agent", {
        systemPrompt: "You help the user with whatever they need",
        tools: [
            'https://api.think.new/scp/time',
        ],
    });
    console.log(`View agent at:\n> ${await agent.getAgentUI()}`);
    await agent.sendMessage("What is the time?");
    const messages = await agent.getMessages();
    console.log(messages);
}

run().then(() => {
    console.log("done")
}).catch((e) => {
    console.error(e)
})

