import { useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (loadMore, hasMore, loading) => {
  const timeoutRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    // Throttle scroll events for better performance
    if (timeoutRef.current) return;
    
    timeoutRef.current = setTimeout(() => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      
      // Trigger load more when user is 500px from bottom (earlier loading)
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMore();
      }
      
      timeoutRef.current = null;
    }, 50); // Throttle to 50ms for faster response
  }, [loadMore, hasMore, loading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll]);
};

export default useInfiniteScroll;