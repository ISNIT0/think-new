import express, { Request, Response } from 'express';

// Basic example tools
export const scpRouter = express.Router();

scpRouter.post('/time', async (req, res) => {
    console.log('Getting Time');
    const date = new Date();
    res.json({
        message: `Current time is ${date.toUTCString()}`
    });
});

scpRouter.get('/time', async (req, res) => {
    res.json({
        scpVersion: '1.0.0',
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        title: 'Get Current Time',
        description: 'Get the current time in UTC format',
        properties: {},
        type: 'object',
        responseSchema: {
            title: 'Get Current Time Response',
            type: 'object',
            required: ['message'],
            properties: {
                message: {
                    type: 'string',
                    description: 'Current time in UTC format',
                },
            },
            additionalProperties: false,
        },
    });
});

scpRouter.post('/add', (async (req: Request, res: Response) => {
    console.log('/add', req.body);
    const { a, b } = req.body;
    if (typeof a !== 'number' || typeof b !== 'number') {
        return res.status(400).json({
            error: 'Invalid input. Both a and b must be numbers.'
        });
    }
    const result = a + b;
    res.json({
        result,
    });
}) as any);

scpRouter.get('/add', async (req, res) => {
    res.json({
        scpVersion: '1.0.0',
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        title: 'Add Two Numbers',
        description: 'Add two numbers together',
        properties: {
            a: {
                type: 'number',
                description: 'First number',
            },
            b: {
                type: 'number',
                description: 'Second number',
            },
        },
        required: ['a', 'b'],
        type: 'object',
        responseSchema: {
            title: 'Add Two Numbers Response',
            type: 'object',
            required: ['result'],
            properties: {
                result: {
                    type: 'number',
                    description: 'Sum of the two numbers',
                },
            },
            additionalProperties: false,
        },

    });
});