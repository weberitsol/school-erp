/**
 * useNetworkStatus Hook - Monitor network connectivity status
 */

import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  type: NetInfoStateType | null;
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    type: null,
    isConnected: true,
    isInternetReachable: true,
  });

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      console.log('[NetworkStatus] State changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOnline,
      });

      setNetworkStatus({
        isOnline,
        type: state.type,
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      setNetworkStatus({
        isOnline,
        type: state.type,
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
}
