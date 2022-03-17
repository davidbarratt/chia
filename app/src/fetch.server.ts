import { Agent } from 'https';
import { readFile } from 'fs/promises';

interface NodeRequestInit extends RequestInit {
    agent?: Agent | ((parsedUrl: URL) => Agent);
}

export enum ChiaService {
    FULL_NODE,
}

interface ChiaServiceMeta {
    base: URL,
    cert: Buffer,
    key: Buffer,
};

async function getServiceMeta(endpoint: ChiaService): Promise<ChiaServiceMeta> {
    switch (endpoint) {
        case ChiaService.FULL_NODE:
            const [cert, key] = await Promise.all([
                readFile('/run/secrets/full_node/private_full_node.crt'),
                readFile('/run/secrets/full_node/private_full_node.key'),
            ]);
            return {
                base: new URL(process.env.CHIA_FULL_NODE_URL || 'https://localhost:8555'),
                cert,
                key,
            };
    }
}

export async function createFetch(endpoint: ChiaService): Promise<typeof fetch> {
    const { base, cert, key } = await getServiceMeta(endpoint);

    return (resource: RequestInfo, init?: RequestInit) => {
        if (typeof resource === 'string') {
            const url = new URL(resource, base);
            resource = url.toString();
        }

        const options: NodeRequestInit = {
            method: 'POST',
            agent: new Agent({
                rejectUnauthorized: false,
                cert,
                key,
                timeout: 5_000,
            }),
            body: JSON.stringify({}),
            ...(init || {}),
            headers: {
                'Content-Type': 'application/json',
                ...(init?.headers || {}),
            },
        };

        return fetch(resource, options);
    };
}