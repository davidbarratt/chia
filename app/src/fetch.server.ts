import { Agent } from 'https';
import { readFile } from 'fs/promises';

interface NodeRequestInit extends RequestInit {
    agent?: Agent | ((parsedUrl: URL) => Agent);
}

export default async function createFetch(): Promise<typeof fetch> {
    const [cert, key] = await Promise.all([
        readFile('./certs/full_node/private_full_node.crt'),
        readFile('./certs/full_node/private_full_node.key'),
    ]);

    return (resource: RequestInfo, init?: RequestInit) => {
        return fetch(resource, {
            agent: new Agent({
                rejectUnauthorized: false,
                cert,
                key,
                timeout: 5_000,
            }),
            ...(init || {}),
        } as NodeRequestInit);
    };
}