# @think-new/sdk

Official TypeScript SDK for the Think Agent API.

## Installation

```bash
npm install @think-new/sdk
# or
yarn add @think-new/sdk
# or
pnpm add @think-new/sdk
```

## Usage

### Creating a New Agent

```typescript
import { Think } from '@think-new/sdk';

const agent = new Think('MyAgent', {
  systemPrompt: 'You are a helpful assistant',
  tools: [
    // Array of SCP endpoint URLs
    'https://api.example.com/scp/calculator',
    'https://api.example.com/scp/weather'
  ]
});

// Send a message and wait for the assistant's response
const response = await agent.sendMessage('What is the weather like today?');
console.log('Assistant:', response.content);

// You can also customize the polling interval (in milliseconds)
const response2 = await agent.sendMessage('Calculate 2 + 2', {}, 500);
console.log('Assistant:', response2.content);

// Get conversation history
const messages = await agent.getMessages();
console.log(messages);
```

### Loading an Existing Agent

```typescript
import { Think } from '@think-new/sdk';

const agent = await Think.fromId('your-agent-id');

// Send a message and wait for the complete response
const response = await agent.sendMessage('Continue our conversation...');
console.log('Assistant:', response.content);

// Get full conversation history
const messages = await agent.getMessages();
```

### SCP Tool Validation

The SDK supports the Structured Completion Protocol (SCP) v1.0.0 for tools. Each tool URL must point to a discovery endpoint that returns a JSON Schema describing its inputs and outputs.

When creating an agent, the SDK will:
1. Validate each tool's SCP endpoint
2. Ensure compatibility with SCP v1.0.0
3. Validate the schema structure
4. Handle errors according to RFC 7807 Problem Details

#### Tool Configuration

Simply provide an array of SCP endpoint URLs:

```typescript
const tools = [
  'https://api.example.com/scp/calculator',
  'https://api.example.com/scp/weather',
  'https://api.example.com/scp/search'
];

const agent = new Think('MyAgent', { tools });
```

The SDK will automatically:
1. Validate each tool's SCP endpoint
2. Ensure version compatibility (v1.x.x)
3. Validate schema structure
4. Handle errors according to RFC 7807 Problem Details

### Error Handling

The SDK provides typed errors for better error handling:

```typescript
import { Think, ThinkNotFoundError, ThinkAPIError, ThinkValidationError } from '@think-new/sdk';

try {
  const agent = new Think('MyAgent', {
    tools: [
      'https://api.example.com/scp/calculator',
      'https://api.example.com/scp/weather'
    ]
  });
} catch (error) {
  if (error instanceof ThinkValidationError) {
    console.log('SCP Validation Error:', error.errors);
  } else if (error instanceof ThinkNotFoundError) {
    console.log('Agent not found');
  } else if (error instanceof ThinkAPIError) {
    console.log('API Error:', error.statusCode, error.response);
  }
}
```

## API Reference

### `Think` Class

#### Constructor
```typescript
new Think(name: string, options?: ThinkOptions)
```

Options:
- `tools?: string[]` - Array of SCP endpoint URLs
- `systemPrompt?: string` - Initial system prompt
- `baseUrl?: string` - Custom API URL (defaults to https://api.think.new/api)

#### Methods

- `static async fromId(id: string, options?: ThinkOptions): Promise<Think>`
  - Load an existing agent by ID

- `async sendMessage(message: string, meta?: Record<string, any>, pollInterval?: number): Promise<Message>`
  - Send a message to the agent and wait for the assistant's response
  - Returns the assistant's response message
  - `pollInterval` (optional): Interval in milliseconds to check for response (default: 1000)
  - Note: This method will wait until the assistant has finished processing, including any tool calls

- `async getMessages(): Promise<Message[]>`
  - Get all messages in the conversation

- `get agentId(): string | null`
  - Get the current agent ID

### Error Types

- `ThinkError` - Base error class
- `ThinkAPIError` - API-related errors with status code and response data
- `ThinkNotFoundError` - 404 Not Found errors
- `ThinkValidationError` - SCP validation errors with detailed error information

### SCP Compatibility

This SDK implements the Structured Completion Protocol (SCP) v1.0.0:
- Automatic schema validation during agent creation
- Support for RFC 7807 Problem Details
- Version compatibility checking (v1.x.x)
- Zod-based schema validation

## License

MIT 