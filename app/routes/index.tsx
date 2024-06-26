import { ChiaService, createFetch } from '~/src/fetch.server';
import { LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import { ReactNode, useEffect } from 'react';

import net from 'net';
import fileSize from 'filesize';

interface BlockChainStateSync {
  sync_mode: boolean;
  sync_progress_height: number;
  sync_tip_height: number;
  synced: boolean;
}

interface BlockChainState {
  sync: BlockChainStateSync;
}

interface BlockChainStateResponse {
  blockchain_state: BlockChainState
  success: boolean;
}

interface LoaderData {
  sync: BlockChainStateSync;
  farmer: boolean,
  plots: number,
  size: string,
}

interface Plot {
  file_size: number,
}

interface PlotsResponse {
  plots: Plot[];
  success: boolean;
}

function isBlockChainStateResponse(data: unknown): data is BlockChainStateResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  return 'blockchain_state' in data;
}

async function getBlockChainState(): Promise<BlockChainState> {
  const fullNodeFetch = await createFetch(ChiaService.FULL_NODE);

  const response = await fullNodeFetch('get_blockchain_state');

  if (!response.ok) {
    throw new Error(`Error Response from Chia: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as unknown;

  if (!isBlockChainStateResponse(data)) {
    throw new Error('Unknown Response');
  }

  return data.blockchain_state;
}


function isPlotsResponse(data: unknown): data is PlotsResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  return 'plots' in data;
}

async function getPlots(): Promise<Plot[]> {
  const harvesterFetch = await createFetch(ChiaService.HARVESTER);

  const response = await harvesterFetch('get_plots');

  if (!response.ok) {
    throw new Error(`Error Response from Chia: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as unknown;

  if (!isPlotsResponse(data)) {
    throw new Error('Unknown Response');
  }

  return data.plots;
}

function isReachable(url: URL): Promise<boolean> {
  return new Promise(((resolve, reject) => {
    const socket = new net.Socket();

		socket.once('error', (e) => {
			socket.destroy();
			reject(e);
		});

		socket.connect(Number(url.port), url.hostname, () => {
			socket.end();
			resolve(true);
		});
	}));
}

async function getFarmerStatus(): Promise<boolean> {
  const url = new URL(process.env.CHIA_FARMER_URL || 'https://localhost:8559');

  return isReachable(url);
}

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  const [state, farmer, plots] = await Promise.all([
    getBlockChainState(),
    getFarmerStatus(),
    getPlots(),
  ]);

  const totalSize = plots.reduce((acc, { file_size }) => {
    return acc + file_size;
  }, 0);

  return {
    sync: state.sync,
    farmer,
    plots: plots.length,
    size: fileSize(totalSize),
  };
};

enum SyncStatus {
  SYNCED = 'Synced',
  SYNCING = 'Syncing',
  NOTSYNCING = 'Not Syncing',
  UNKNOWN = 'Unknown',
  FARMINMG = 'Farming',
  NOTFARMING = 'Not Farming',
}

interface SyncState {
  status: SyncStatus;
  textColor: string;
  iconColor: string;
}

interface LayoutProps {
  iconColor: string;
  textColor: string;
  text: string;
  state?: 'loading' | 'idle' | 'submitting';
  children: ReactNode;
}

function Layout({ iconColor, textColor, text, children, state}: LayoutProps) {
  let animateClass = '';
  if (state === 'loading') {
    animateClass = 'animate-pulse';
  }

  return (
    <div className="container max-w-md mx-auto px-6">
      <div className="flex h-screen">
        <div className="m-auto w-full">
          <div className={`w-24 ${animateClass}`}>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
	 viewBox="0 0 127.51 123.41">
              <g id="Layer_2">
                <path id="path0" className={iconColor} d="M71.32,26.09c-0.34,0.03-1.59,0.13-2.78,0.23c-2.05,0.16-5.13,0.53-5.63,0.69
              c-0.13,0.04-0.68,0.14-1.23,0.23c-4.02,0.63-9,2.25-11.8,3.83c-0.51,0.29-1.06,0.58-1.23,0.64c-0.64,0.25-4.84,3.18-6.4,4.46
              C30.76,45.59,24.66,60.3,27.22,72.45c0.31,1.48,0.35,1.5,1.4,0.72c1.68-1.25,3.16-2.2,5.22-3.38c1.21-0.69,6.43-3.23,6.64-3.23
              c0.03,0,0.43-0.17,0.88-0.37c4.57-2.1,17.88-6.66,24.56-8.42c0.25-0.07,1.4-0.38,2.54-0.69c6.34-1.73,7.4-1.96,7.4-1.66
              c0,0.06-0.36,0.25-0.81,0.4c-2.18,0.76-8.12,3.15-8.36,3.36c-0.08,0.07-0.23,0.13-0.34,0.13c-0.1,0-0.64,0.21-1.19,0.46
              c-0.55,0.25-1.04,0.46-1.1,0.46c-0.05,0-0.62,0.24-1.25,0.54c-0.63,0.3-1.18,0.54-1.22,0.54c-0.04,0-0.66,0.28-1.39,0.62
              c-0.73,0.34-1.36,0.62-1.4,0.62c-0.65,0-15.51,7.77-20.2,10.56c-1.07,0.64-1.97,1.16-2,1.16c-0.05,0-1.5,0.91-6.16,3.86
              c-5.19,3.28-13.86,9.42-19.2,13.61c-0.64,0.5-1.4,1.09-1.69,1.32c-4.63,3.6-5.22,4.26-2.59,2.88c5.91-3.09,12.5-6.18,17.24-8.06
              c2.9-1.16,5.96-2.02,8.03-2.27l0.86-0.1l2.15,2.15c5.61,5.61,11.65,8.46,20.54,9.69c2.12,0.29,8.9,0.25,10.52-0.06
              c0.47-0.09,1.51-0.28,2.31-0.41c0.81-0.14,1.67-0.31,1.93-0.38s0.91-0.25,1.46-0.39C82.24,93.45,91,87.11,98.76,76.72
              c0.17-0.23,0.86-1.13,1.54-2.01c0.68-0.88,1.38-1.81,1.55-2.06c0.18-0.25,0.61-0.88,0.97-1.39c4.04-5.7,9.76-15.08,13.45-22.05
              c0.4-0.76,1.05-1.98,1.44-2.7c0.39-0.72,1.64-3.22,2.8-5.55c1.15-2.33,2.16-4.36,2.24-4.51c0.33-0.61,0.2-0.75-1.32-1.36
              c-0.17-0.07-1.31-0.45-2.54-0.85c-1.23-0.4-2.62-0.85-3.08-1.01c-2.02-0.68-5.38-1.65-9.48-2.74c-3.55-0.94-4.52-1.19-5.86-1.48
              c-0.68-0.15-1.41-0.33-1.62-0.4c-0.21-0.07-0.8-0.21-1.31-0.3c-1.43-0.27-2.06-0.4-3.39-0.69c-4.96-1.07-9.26-1.46-16.58-1.53
              C74.47,26.05,71.66,26.06,71.32,26.09"/>
              </g>
          </svg>
        </div>
        <div className="text-5xl font-bold mb-2">
          <span className={textColor}>{text}</span>
        </div>
        {children}
      </div>
    </div>
  </div>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = '';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  return (
    <Layout iconColor="fill-red-800" textColor="text-red-800" text="Error">
      <div className="text-lg text-stone-500">{message}</div>
    </Layout>
  );
}

export default function Index() {
  const data = useLoaderData<LoaderData>();
  const fetcher = useFetcher<LoaderData>();
  const location = useLocation();

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        fetcher.load(location.pathname);
      }
    };

    document.addEventListener('visibilitychange', refresh);

    return () => document.removeEventListener('visibilitychange', refresh);
  }, [fetcher, location.pathname]);

  // Use the fetched data, otherwise use the initial data.
  const { sync, farmer, plots, size } = fetcher.data ? fetcher.data : data;

  let syncState: SyncState = {
    status: SyncStatus.UNKNOWN,
    textColor: 'text-stone-700',
    iconColor: 'fill-stone-700',
  };
  if (!sync.sync_mode && sync.synced) {
    if (farmer) {
      syncState = {
        status: SyncStatus.FARMINMG,
        textColor: 'text-chia',
        iconColor: 'fill-chia',
      };
    } else {
      syncState = {
        status: SyncStatus.NOTFARMING,
        textColor: 'text-red-800',
        iconColor: 'fill-red-800',
      };
    }
  } else if (sync.sync_mode && !sync.synced) {
    syncState = {
      status: SyncStatus.SYNCING,
      textColor: 'text-amber-600',
      iconColor: 'fill-amber-600',
    };
  } else if (!sync.sync_mode && !sync.synced) {
    syncState = {
      status: SyncStatus.NOTSYNCING,
      textColor: 'text-red-800',
      iconColor: 'fill-red-800',
    };
  }

  let progress;
  if (sync.sync_tip_height > 0) {
    progress = (
      <div className="text-3xl text-stone-500">{sync.sync_progress_height.toLocaleString()} / {sync.sync_tip_height.toLocaleString()}</div>
    );
  } else if (syncState.status === SyncStatus.FARMINMG) {
    progress = (
      <div className="text-3xl text-stone-500">{plots} {plots > 1 ? 'Plots' : 'Plot'} / {size}</div>
    );
  }

  return (
    <Layout iconColor={syncState.iconColor} textColor={syncState.textColor} text={syncState.status} state={fetcher.state}>
      {progress}
    </Layout>
  );
}
