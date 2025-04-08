import 'dotenv/config';
import express, { Request, Response, Router } from 'express';
import { redis } from './redis';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Agent, ISerialisedAgent } from './Agent';
import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import { scpRouter } from './scp';
import logger from 'morgan';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const router = Router();
app.use(cors());
app.use(bodyParser.json());

// Helper function to get agent key in Redis
const getAgentKey = (agentId: string) => `agent:${agentId}`;

// Create new agent
router.post('/agents', async (req: Request<{}, {}, Omit<ISerialisedAgent, 'id'>>, res: Response) => {
    try {
        const id = uuid();
        const serialisedAgent = req.body;

        // Store in Redis
        await redis.set(
            getAgentKey(id),
            JSON.stringify({ ...serialisedAgent, id })
        );

        res.status(201).json({ success: true, agentId: id });
    } catch (error: any) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send message to agent
router.post('/agents/:agentId', (async (req: Request, res: Response) => {
    try {
        const { agentId } = req.params;
        const { message, meta = {} } = req.body;

        // Get agent from Redis
        const agentData = await redis.get(getAgentKey(agentId));
        if (!agentData) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const serialisedAgent: ISerialisedAgent = JSON.parse(agentData);

        // Create agent instance
        const agent = new Agent(
            serialisedAgent,
            openai,
            async (agent, message) => {
                // Update Redis when agent state changes
                await redis.set(
                    getAgentKey(agent.id),
                    JSON.stringify({
                        id: agent.id,
                        name: agent.name,
                        tools: agent.tools,
                        messages: agent.messages,
                        systemPrompt: agent.systemPrompt
                    })
                );
            }
        );

        // Send message
        await agent.sendMessage(message, meta);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}) as any);

// Get agent state
router.get('/agents/:agentId', (async (req: Request, res: Response) => {
    try {
        const { agentId } = req.params;

        // Get agent from Redis
        const agentData = await redis.get(getAgentKey(agentId));
        if (!agentData) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const serialisedAgent: ISerialisedAgent = JSON.parse(agentData);
        res.json(serialisedAgent);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}) as any);

app.use('/api', router);
scpRouter.use(logger('tiny'));
app.use('/scp', scpRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('\n\n> Server started');
    console.log(`Server is running on port ${PORT}\n\n> http://localhost:${PORT}`);
    console.log('> Press CTRL-C to stop the server');
});