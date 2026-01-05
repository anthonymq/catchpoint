import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';

export type NetworkStatus = 'unknown' | 'offline' | 'online';

interface NetworkState {
  status: NetworkStatus;
  isConnected: boolean;
  type: Network.NetworkStateType;
  isInternetReachable: boolean | null;
}

export function useNetworkStatus(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    status: 'unknown',
    isConnected: false,
    type: Network.NetworkStateType.UNKNOWN,
    isInternetReachable: null,
  });

  useEffect(() => {
    let mounted = true;

    const updateNetworkState = async () => {
      const state = await Network.getNetworkStateAsync();
      
      if (!mounted) return;

      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? null;
      
      let status: NetworkStatus;
      if (!isConnected) {
        status = 'offline';
      } else if (isInternetReachable === false) {
        status = 'offline';
      } else {
        status = 'online';
      }

      setNetworkState({
        status,
        isConnected,
        type: state.type ?? Network.NetworkStateType.UNKNOWN,
        isInternetReachable,
      });
    };

    // Initial fetch
    updateNetworkState();

    // Subscribe to network changes
    const subscription = Network.addNetworkStateListener((state) => {
      if (!mounted) return;

      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? null;
      
      let status: NetworkStatus;
      if (!isConnected) {
        status = 'offline';
      } else if (isInternetReachable === false) {
        status = 'offline';
      } else {
        status = 'online';
      }

      setNetworkState({
        status,
        isConnected,
        type: state.type ?? Network.NetworkStateType.UNKNOWN,
        isInternetReachable,
      });
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return networkState;
}

// Hook for async check (more reliable for immediate checks)
export async function checkNetworkStatus(): Promise<NetworkState> {
  const state = await Network.getNetworkStateAsync();
  
  const isConnected = state.isConnected ?? false;
  const isInternetReachable = state.isInternetReachable ?? null;
  
  let status: NetworkStatus;
  if (!isConnected) {
    status = 'offline';
  } else if (isInternetReachable === false) {
    status = 'offline';
  } else {
    status = 'online';
  }

  return {
    status,
    isConnected,
    type: state.type ?? Network.NetworkStateType.UNKNOWN,
    isInternetReachable,
  };
}

// Hook that triggers callback on network status change
export function useNetworkEffect(
  callback: (isOnline: boolean) => void,
  deps: React.DependencyList = []
): void {
  const networkStatus = useNetworkStatus();

  useEffect(() => {
    callback(networkStatus.status === 'online');
  }, [networkStatus.status, ...deps]);
}
