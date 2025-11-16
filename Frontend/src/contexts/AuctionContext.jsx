// src/contexts/AuctionContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";

const AuctionContext = createContext();

const initialAuctions = [
  // (use a small set or your full list - shortened for clarity)
  {
    id: "demo1",
    title: 'Apple MacBook Pro 16"',
    description: "M3 Pro chip, 16GB RAM, 512GB SSD",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    startingPrice: 1200,
    currentBid: 1450,
    minIncrement: 20,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
    status: "active",
    bids: [{ id: "1", bidder: "Alice", amount: 1450, time: new Date().toISOString() }],
    currentBidder: "Alice"
  },
  {
    id: "demo2",
    title: "Sony WH-1000XM5",
    description: "Noise cancelling headphones.",
    image:
      "https://images.unsplash.com/photo-1580894894513-64c9e52f4b25?auto=format&fit=crop&w=800&q=80",
    startingPrice: 250,
    currentBid: 310,
    minIncrement: 10,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    status: "active",
    bids: [{ id: "1", bidder: "John", amount: 310, time: new Date().toISOString() }],
    currentBidder: "John"
  }
];

export const AuctionProvider = ({ children }) => {
  const [auctions, setAuctions] = useState(() => {
    try {
      const stored = localStorage.getItem("auctions");
      return stored ? JSON.parse(stored) : initialAuctions;
    } catch (e) {
      return initialAuctions;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return localStorage.getItem("currentUser") || "You";
    } catch {
      return "You";
    }
  });

  // persist auctions
  useEffect(() => {
    try {
      localStorage.setItem("auctions", JSON.stringify(auctions));
    } catch (e) {
      console.error("localStorage save failed", e);
    }
  }, [auctions]);

  // timer to mark ended auctions
  useEffect(() => {
    const intv = setInterval(() => {
      setAuctions(prev =>
        prev.map(a => {
          if (a.status === "active") {
            const now = Date.now();
            if (new Date(a.endTime).getTime() <= now) {
              return { ...a, status: "ended" };
            }
          }
          return a;
        })
      );
    }, 1000);
    return () => clearInterval(intv);
  }, []);

  const placeBid = useCallback(
    (auctionId, amount) => {
      console.log("[placeBid] called:", auctionId, amount);
      setAuctions(prev =>
        prev.map(a => {
          if (a.id !== auctionId) return a;
          // basic validation server-side would go here; UI already validated minBid
          const now = new Date();
          const end = new Date(a.endTime);
          // extend endTime if within last 10s (anti-sniping)
          let newEnd = a.endTime;
          const secondsLeft = (end.getTime() - now.getTime()) / 1000;
          if (secondsLeft > 0 && secondsLeft <= 10) {
            newEnd = new Date(now.getTime() + 10 * 1000).toISOString();
          }
          const newBid = {
            id: Date.now().toString(),
            bidder: currentUser,
            amount,
            time: new Date().toISOString()
          };
          return {
            ...a,
            currentBid: amount,
            currentBidder: currentUser,
            bids: [newBid, ...(a.bids || [])],
            endTime: newEnd
          };
        })
      );
      // small simulated auto-bid from bots (optional)
      setTimeout(() => {
        if (Math.random() > 0.8) {
          setAuctions(prev =>
            prev.map(a => {
              if (a.id !== auctionId || a.status !== "active") return a;
              const botAmount = (a.currentBid || a.startingPrice) + (a.minIncrement || 1) + Math.floor(Math.random() * 50);
              const botBid = {
                id: Date.now().toString() + "-bot",
                bidder: "AutoBidder",
                amount: botAmount,
                time: new Date().toISOString()
              };
              return {
                ...a,
                currentBid: botAmount,
                currentBidder: "AutoBidder",
                bids: [botBid, ...(a.bids || [])]
              };
            })
          );
        }
      }, 1500 + Math.random() * 2000);
    },
    [currentUser]
  );

  const getTimeRemaining = useCallback(endTime => {
    const now = Date.now();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, total: diff };
  }, []);

  const value = useMemo(
    () => ({ auctions, setAuctions, currentUser, setCurrentUser, placeBid, getTimeRemaining }),
    [auctions, currentUser, placeBid, getTimeRemaining]
  );

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
};

export const useAuction = () => {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error("useAuction must be used inside AuctionProvider");
  return ctx;
};
