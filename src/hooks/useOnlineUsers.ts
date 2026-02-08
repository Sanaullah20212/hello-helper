import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OnlineUser {
  visitorId: string;
  currentPage: string;
  onlineAt: string;
}

export const useOnlineUsers = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupPresence = async () => {
      // Get or create visitor ID
      let visitorId = localStorage.getItem('btspro_visitor_id');
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('btspro_visitor_id', visitorId);
      }

      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: visitorId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: OnlineUser[] = [];
          
          Object.entries(state).forEach(([key, presences]) => {
            if (Array.isArray(presences) && presences.length > 0) {
              const presence = presences[0] as { currentPage?: string; onlineAt?: string };
              users.push({
                visitorId: key,
                currentPage: presence.currentPage || '/',
                onlineAt: presence.onlineAt || new Date().toISOString(),
              });
            }
          });
          
          setOnlineUsers(users);
          setOnlineCount(users.length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              currentPage: window.location.pathname,
              onlineAt: new Date().toISOString(),
            });
          }
        });

      // Update presence when page changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && channel) {
          channel.track({
            currentPage: window.location.pathname,
            onlineAt: new Date().toISOString(),
          });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { onlineCount, onlineUsers };
};

export default useOnlineUsers;
