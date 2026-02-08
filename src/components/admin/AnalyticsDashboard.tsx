import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Clock, 
  Monitor,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";

const AnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useAnalytics();
  const { onlineCount, onlineUsers } = useOnlineUsers();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Online Now */}
        <Card className="border-green-500/50 bg-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              অনলাইনে আছেন
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{onlineCount}</div>
            <p className="text-xs text-muted-foreground">জন এখন সাইটে আছেন</p>
          </CardContent>
        </Card>

        {/* Today Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              আজকের ভিউ
            </CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.todayViews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.todayUniqueVisitors || 0} ইউনিক ভিজিটর
            </p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              মোট ভিউ
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalViews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">সর্বমোট পেজ ভিউ</p>
          </CardContent>
        </Card>

        {/* Weekly Unique Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              সাপ্তাহিক ভিজিটর
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.uniqueVisitors?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">গত ৭ দিনে ইউনিক</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Shows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              জনপ্রিয় শো (গত ৭ দিন)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.popularShows?.length === 0 && (
                <p className="text-muted-foreground text-sm">এখনো কোন ডাটা নেই</p>
              )}
              {analytics?.popularShows?.slice(0, 10).map((show, index) => (
                <div key={show.show_id} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  {show.poster_url && (
                    <img 
                      src={show.poster_url} 
                      alt={show.show_title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/show/${show.show_slug}`}
                      className="font-medium hover:text-primary truncate block"
                    >
                      {show.show_title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {show.view_count.toLocaleString()} views
                    </p>
                  </div>
                  <Badge variant="secondary">{show.view_count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Online Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              অনলাইন ইউজার ({onlineCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {onlineUsers.length === 0 && (
                <p className="text-muted-foreground text-sm">এখন কেউ অনলাইনে নেই</p>
              )}
              {onlineUsers.map((user, index) => (
                <div key={user.visitorId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Visitor #{index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.currentPage}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.onlineAt).toLocaleTimeString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by Page Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              পেজ টাইপ অনুযায়ী ভিউ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.viewsByType?.map((item) => (
                <div key={item.page_type} className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize min-w-[100px] justify-center">
                    {item.page_type}
                  </Badge>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((item.count / (analytics?.totalViews || 1)) * 100 * 5, 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium min-w-[60px] text-right">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              সাম্প্রতিক ভিউ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {analytics?.recentViews?.map((view) => (
                <div key={view.id} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/30">
                  <Badge variant="outline" className="capitalize text-xs">
                    {view.page_type}
                  </Badge>
                  <span className="flex-1 truncate text-muted-foreground">
                    {view.page_path}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(view.created_at).toLocaleTimeString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
