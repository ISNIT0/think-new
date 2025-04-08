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
import axios from 'axios';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Schema for validating SCP discovery response
const scpToolSchema = z.object({
    scpVersion: z.string(),
    endpointVersion: z.string().optional(),
    $schema: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    type: z.literal('object'),
    required: z.array(z.string()).optional(),
    properties: z.record(z.any()),
    additionalProperties: z.boolean().optional(),
    responseSchema: z.object({
        $schema: z.string().optional(),
        title: z.string().optional(),
        type: z.literal('object'),
        required: z.array(z.string()),
        properties: z.record(z.any()),
        additionalProperties: z.boolean().optional(),
    }),
    url: z.string().url(),
    auth: z.object({
        type: z.string(),
        instructions: z.string(),
    }).optional(),
});

export type SCPTool = z.infer<typeof scpToolSchema>;

// Schema for create agent request
const createAgentSchema = z.object({
    name: z.string(),
    systemPrompt: z.string().optional(),
    tools: z.array(z.object({
        url: z.string().url(),
        title: z.string(),
        description: z.string().optional(),
    }))
});

const app = express();
const router = Router();
app.use(cors());
app.use(bodyParser.json());
app.use(logger('tiny'));

// Helper function to get agent key in Redis
const getAgentKey = (agentId: string) => `agent:${agentId}`;

// Helper function to validate SCP endpoint
async function validateSCPEndpoint(url: string): Promise<SCPTool | null> {
    try {
        const response = await axios.get(url);
        const data = response.data;

        // Validate major version (we only support 1.x.x)
        const versionMatch = data.scpVersion?.match(/^(\d+)\./);
        if (!versionMatch || versionMatch[1] !== '1') {
            return null;
        }

        // Validate schema
        const result = scpToolSchema.safeParse(data);
        if (!result.success) {
            return null;
        }

        return result.data;
    } catch (error) {
        return null;
    }
}

// Create new agent
router.post('/agents', (async (req: Request<{}, {}, {
    name: string;
    systemPrompt?: string;
    tools: Array<{
        url: string;
        title: string;
        description?: string;
    }>;
}>, res: Response) => {
    try {
        // Validate request body
        const parseResult = createAgentSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                title: 'Schema Validation Error',
                status: 400,
                detail: 'Invalid request body',
                validation_errors: parseResult.error.errors
            });
        }

        const { name, systemPrompt, tools } = parseResult.data;

        // Validate each tool's SCP endpoint
        const validatedTools = [];
        for (const tool of tools) {
            const validatedTool = await validateSCPEndpoint(tool.url);
            if (!validatedTool) {
                return res.status(400).json({
                    title: 'Invalid SCP Endpoint',
                    status: 400,
                    detail: `Invalid or incompatible SCP endpoint: ${tool.url}`,
                });
            }
            // Convert validated tool to ISCPToolDefinition format
            validatedTools.push(validatedTool);
        }

        const id = uuid();
        const serialisedAgent: ISerialisedAgent = {
            id,
            name,
            systemPrompt,
            tools: validatedTools,
            messages: []
        };

        // Store in Redis
        await redis.set(
            getAgentKey(id),
            JSON.stringify(serialisedAgent)
        );

        res.status(201).json({
            status: 'success',
            result: {
                agentId: id
            }
        });
    } catch (error: any) {
        console.error('Error creating agent:', error);
        res.status(500).json({
            title: 'Internal Server Error',
            status: 500,
            detail: error.message
        });
    }
}) as any);

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