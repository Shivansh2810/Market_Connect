import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuctionListing.css';

const AuctionListing = ({ auctions: passedAuctions = [], onNavigate }) => {
  const navigate = useNavigate();
  const [timeUpdates, setTimeUpdates] = useState({});

  const demoAuctions = [
    {
      id: 'demo1',
      title: 'Apple MacBook Pro 16"',
      description: 'M3 Pro chip, 16GB RAM, 512GB SSD — 2024 model.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      startingPrice: 1200,
      currentBid: 1450,
      bids: [{ id: 1, bidder: 'Alice', amount: 1450 }],
      endTime: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
      status: 'active',
    }
  ];

  const auctionsList = Array.isArray(passedAuctions) ? passedAuctions : [];

  const normalizedAuctions = auctionsList
    .map(a => {
      if (a && a.auctionDetails) {
        return {
          id: a._id,
          title: a.title,
          description: a.description,
          image: a.images?.[0]?.url || a.images?.[0] || '',
          startingPrice: a.auctionDetails.startPrice,
          currentBid: a.auctionDetails.currentBid,
          bids: a.auctionDetails.bidHistory || [],
          endTime: a.auctionDetails.endTime,
          status: a.auctionDetails.status,
        };
      }
      return a;
    })
    .filter(a => a && new Date(a.endTime) > new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const updates = {};
      const auctionsToShow = normalizedAuctions.length > 0 ? normalizedAuctions : demoAuctions;
      auctionsToShow.forEach(a => {
        const diff = new Date(a.endTime) - new Date();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        updates[a.id] = {
          total: diff,
          seconds,
          minutes,
          hours,
          days,
        };
      });
      setTimeUpdates(updates);
    }, 1000);

    return () => clearInterval(interval);
  }, [passedAuctions]);

  const formatTime = (time) => {
    if (!time || time.total <= 0) return 'Ended';

    if (time.days > 0) return `${time.days}d ${time.hours}h`;
    if (time.hours > 0) return `${time.hours}h ${time.minutes}m`;
    if (time.minutes > 0) return `${time.minutes}m ${time.seconds}s`;
    return `${time.seconds}s`;
  };

  const auctionsToShow = normalizedAuctions.length > 0 ? normalizedAuctions : demoAuctions;

  if (!auctionsToShow || auctionsToShow.length === 0) {
    return (
      <div className="auction-listing empty">
        <p>No active auctions right now.</p>
      </div>
    );
  }

  return (
    <div className="auction-listing">
      {auctionsToShow.map(a => (
        <div key={a.id} className="auction-item" onClick={() => (onNavigate ? onNavigate(a.id) : navigate(`/auction/${a.id}`))}>
          <div className="auction-thumb">
            <img src={a.image || 'https://via.placeholder.com/300?text=No+Image'} alt={a.title} />
          </div>
          <div className="auction-meta">
            <h4>{a.title}</h4>
            <p className="auction-desc">{a.description}</p>
            <div className="auction-footer">
              <div className="price">Start: ₹{a.startingPrice}</div>
              <div className="current">Now: ₹{a.currentBid}</div>
              <div className="time">{formatTime(timeUpdates[a.id])}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuctionListing;
