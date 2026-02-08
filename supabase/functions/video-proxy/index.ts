import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get('url');

    if (!videoUrl) {
      console.error('No video URL provided');
      return new Response(
        JSON.stringify({ error: 'Video URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying video from:', videoUrl);

    // Get range header for seeking support
    const rangeHeader = req.headers.get('range');
    
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
      console.log('Range request:', rangeHeader);
    }

    // Fetch the video from the original URL
    const response = await fetch(videoUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    if (!response.ok && response.status !== 206) {
      console.error('Failed to fetch video:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch video', status: response.status }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get content info from response
    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    const contentLength = response.headers.get('Content-Length');
    const contentRange = response.headers.get('Content-Range');
    const acceptRanges = response.headers.get('Accept-Ranges') || 'bytes';

    console.log('Video content type:', contentType);
    console.log('Video content length:', contentLength);

    // Build response headers for streaming
    const responseHeaders: HeadersInit = {
      ...corsHeaders,
      'Content-Type': contentType.includes('video') ? contentType : 'video/mp4',
      'Accept-Ranges': acceptRanges,
      'Cache-Control': 'public, max-age=3600',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    // Stream the video
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Video proxy error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
