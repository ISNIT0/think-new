import { z } from 'zod';

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

export interface SCPValidationError {
    message: string;
    details?: any;
}

export interface SCPValidationResult {
    isValid: boolean;
    error?: SCPValidationError;
    discovery?: SCPTool;
}

/**
 * Validates an SCP endpoint by making a GET request and validating the schema
 */
export async function validateSCPEndpoint(url: string): Promise<SCPValidationResult> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            return {
                isValid: false,
                error: {
                    message: `HTTP error ${response.status}: ${response.statusText}`,
                }
            };
        }

        const data = await response.json();

        // Validate major version (we only support 1.x.x)
        const versionMatch = data.scpVersion?.match(/^(\d+)\./);
        if (!versionMatch || versionMatch[1] !== '1') {
            return {
                isValid: false,
                error: {
                    message: `Unsupported SCP version: ${data.scpVersion}. Only version 1.x.x is supported.`,
                }
            };
        }

        // Validate schema
        const result = scpToolSchema.safeParse(data);

        if (!result.success) {
            console.error(result);
            return {
                isValid: false,
                error: {
                    message: 'Invalid SCP schema',
                    details: result.error.format(),
                }
            };
        }

        return {
            isValid: true,
            discovery: result.data,
        };

    } catch (error) {
        return {
            isValid: false,
            error: {
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                details: error,
            }
        };
    }
} 