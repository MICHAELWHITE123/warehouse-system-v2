import React from 'react';
import { useSupabaseRealtime } from '../adapters/supabaseRealtimeAdapter';

export function SupabaseRealtimeTest() {
  const {
    isConnected,
    connectionError,
    lastEvent,
    connect,
    disconnect
  } = useSupabaseRealtime({
    tables: ['equipment', 'shipments', 'categories', 'locations', 'equipment_stacks'],
    onEquipmentChange: (event) => {
      console.log('📦 Equipment realtime update:', event);
    },
    onShipmentChange: (event) => {
      console.log('🚚 Shipment realtime update:', event);
    },
    onCategoryChange: (event) => {
      console.log('📁 Category realtime update:', event);
    },
    onLocationChange: (event) => {
      console.log('📍 Location realtime update:', event);
    },
    onStackChange: (event) => {
      console.log('📚 Stack realtime update:', event);
    },
    onAnyChange: (event) => {
      console.log('🔄 Any realtime update:', event);
    }
  });

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Supabase Realtime Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {connectionError && (
          <div className="text-red-600 text-sm">
            Error: {connectionError}
          </div>
        )}
        
        {lastEvent && (
          <div className="text-sm">
            <span className="font-medium">Last Event:</span>
            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(lastEvent, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={connect}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
