import { API_BASE } from "../api";

export interface Tool {
    title: string;
    description?: string;
    url?: string;
}

// Sample tools that come pre-packaged with the system
export const SAMPLE_TOOLS: Tool[] = [
    {
        title: 'Get Time',
        description: 'Get the current time in UTC format',
        url: new URL(`/scp/time`, API_BASE).toString(),
    },
    {
        title: 'Add Numbers',
        description: 'Add two numbers together',
        url: new URL(`/scp/add`, API_BASE).toString(),
    }
    // {
    //     id: 'web-search',
    //     name: 'Web Search',
    //     type: 'sample',
    //     description: 'Search the web for real-time information',
    // },
    // {
    //     id: 'code-interpreter',
    //     name: 'Code Interpreter',
    //     type: 'sample',
    //     description: 'Execute code and perform computations',
    // },
    // {
    //     id: 'file-manager',
    //     name: 'File Manager',
    //     type: 'sample',
    //     description: 'Read, write, and manage files',
    // },
];


console.log(SAMPLE_TOOLS)