import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getActiveAuctions as fetchActiveAuctions, getAuctionById } from '../../api/auction';
import { useAuth } from './AuthContext';

const AuctionContext = createContext(null);

export const AuctionProvider = ({ children }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const { user, token } = useAuth();

  // Transform backend product -> UI auction shape
  const transformProductToAuction = (p) => {
    return {
      id: p._id,
      title: p.title,
      description: p.description,
      image: p.images && p.images.length > 0 ? p.images[0].url : 'https://via.placeholder.com/400?text=No+Image',
      startingPrice: p.auctionDetails?.startPrice || 0,
      currentBid: p.auctionDetails?.currentBid || p.auctionDetails?.startPrice || 0,
      minIncrement: p.auctionDetails?.minIncrement || 1,
      bids: (p.auctionDetails?.bidHistory || []).map(b => ({
        id: b._id,
        bidder: b.user?.name || 'Bidder',
        amount: b.amount,
        time: b.createdAt,
      })),
      endTime: p.auctionDetails?.endTime,
      status: p.auctionDetails?.status?.toLowerCase() || 'pending',
      raw: p,
    };
  };

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const data = await fetchActiveAuctions();
      // backend may return array of products
      const arr = Array.isArray(data) ? data : (data.data || []);
      const mapped = arr.map(transformProductToAuction);
      setAuctions(mapped);
    } catch (err) {
      console.error('Failed to load auctions', err);
      setError(err.message || 'Failed to load auctions');
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();

    // init socket
    try {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:8080', {
        auth: { token: token || localStorage.getItem('token') },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Auction socket connected', socket.id);
      });

      socket.on('bidUpdate', (payload) => {
        // payload: { currentBid, highestBidder, bid }
        const prodId = payload.bid?.product || payload.bid?.productId || payload.productId || payload.bid?._id;
        // try to find and update
        setAuctions(prev => prev.map(a => {
          if (a.id === prodId || a.id === payload.productId || a.id === payload.bid?.product) {
            const newBids = [
              { id: payload.bid._id || Date.now().toString(), bidder: payload.bid.user?.name || payload.bid.user || 'Bidder', amount: payload.bid.amount, time: payload.bid.createdAt || new Date().toISOString() },
              ...(a.bids || [])
            ];
            return { ...a, currentBid: payload.currentBid, bids: newBids };
          }
          return a;
        }));
      });

      socket.on('bidError', (msg) => {
        console.warn('Bid error from server:', msg);
      });

      socket.on('auctionEnded', (data) => {
        console.log('Auction ended', data);
        setAuctions(prev => prev.map(a => a.id === String(data.productId) ? { ...a, status: 'completed' } : a));
      });

      socket.on('disconnect', () => console.log('Auction socket disconnected'));

    } catch (err) {
      console.error('Socket init error', err);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const getTimeRemaining = (endTime) => {
    if (!endTime) return null;
    const t = Date.parse(endTime) - Date.now();
    const seconds = Math.floor((t / 1000) % 60);
    const minutes = Math.floor((t / 1000 / 60) % 60);
    const hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    const days = Math.floor(t / (1000 * 60 * 60 * 24));
    return { total: t, days, hours, minutes, seconds };
  };

  const placeBid = (productId, amount) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('Socket not connected — cannot place bid');
      return;
    }
    const userId = user?.id || user?._id;
    socketRef.current.emit('placeBid', { productId, bidAmount: amount, userId });
  };

  const value = {
    auctions,
    loading,
    error,
    refresh: loadAuctions,
    getTimeRemaining,
    placeBid,
    getAuctionById: async (id) => {
      const p = await getAuctionById(id);
      return transformProductToAuction(p);
    }
  };

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
};

export const useAuction = () => {
  const c = useContext(AuctionContext);
  if (!c) throw new Error('useAuction must be used within AuctionProvider');
  return c;
};
