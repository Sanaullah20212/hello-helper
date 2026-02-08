import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalViews: number;
  todayViews: number;
  uniqueVisitors: number;
  todayUniqueVisitors: number;
  popularShows: PopularShow[];
  recentViews: RecentView[];
  viewsByType: ViewByType[];
  hourlyViews: HourlyView[];
}

interface PopularShow {
  show_id: string;
  show_title: string;
  show_slug: string;
  view_count: number;
  poster_url: string | null;
}

interface RecentView {
  id: string;
  page_path: string;
  page_type: string;
  created_at: string;
  visitor_id: string;
}

interface ViewByType {
  page_type: string;
  count: number;
}

interface HourlyView {
  hour: number;
  count: number;
}

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Total views
      const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true });

      // Today views
      const { count: todayViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // Unique visitors (last 7 days)
      const { data: uniqueData } = await supabase
        .from('page_views')
        .select('visitor_id')
        .gte('created_at', last7Days);
      
      const uniqueVisitors = new Set(uniqueData?.map(v => v.visitor_id) || []).size;

      // Today unique visitors
      const { data: todayUniqueData } = await supabase
        .from('page_views')
        .select('visitor_id')
        .gte('created_at', todayStart);
      
      const todayUniqueVisitors = new Set(todayUniqueData?.map(v => v.visitor_id) || []).size;

      // Popular shows (last 7 days)
      const { data: showViews } = await supabase
        .from('page_views')
        .select('show_id')
        .not('show_id', 'is', null)
        .gte('created_at', last7Days);

      // Count views per show
      const showCounts = new Map<string, number>();
      showViews?.forEach(v => {
        if (v.show_id) {
          showCounts.set(v.show_id, (showCounts.get(v.show_id) || 0) + 1);
        }
      });

      // Get top 10 shows
      const topShowIds = Array.from(showCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      let popularShows: PopularShow[] = [];
      if (topShowIds.length > 0) {
        const { data: shows } = await supabase
          .from('shows')
          .select('id, title, slug, poster_url')
          .in('id', topShowIds);

        popularShows = (shows || []).map(show => ({
          show_id: show.id,
          show_title: show.title,
          show_slug: show.slug,
          view_count: showCounts.get(show.id) || 0,
          poster_url: show.poster_url,
        })).sort((a, b) => b.view_count - a.view_count);
      }

      // Recent views
      const { data: recentViews } = await supabase
        .from('page_views')
        .select('id, page_path, page_type, created_at, visitor_id')
        .order('created_at', { ascending: false })
        .limit(20);

      // Views by type (last 7 days)
      const { data: typeData } = await supabase
        .from('page_views')
        .select('page_type')
        .gte('created_at', last7Days);

      const typeCounts = new Map<string, number>();
      typeData?.forEach(v => {
        typeCounts.set(v.page_type, (typeCounts.get(v.page_type) || 0) + 1);
      });

      const viewsByType = Array.from(typeCounts.entries()).map(([page_type, count]) => ({
        page_type,
        count,
      }));

      // Hourly views (last 24 hours)
      const { data: hourlyData } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', last24Hours);

      const hourlyCounts = new Array(24).fill(0);
      hourlyData?.forEach(v => {
        const hour = new Date(v.created_at).getHours();
        hourlyCounts[hour]++;
      });

      const hourlyViews = hourlyCounts.map((count, hour) => ({ hour, count }));

      return {
        totalViews: totalViews || 0,
        todayViews: todayViews || 0,
        uniqueVisitors,
        todayUniqueVisitors,
        popularShows,
        recentViews: recentViews || [],
        viewsByType,
        hourlyViews,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export default useAnalytics;
