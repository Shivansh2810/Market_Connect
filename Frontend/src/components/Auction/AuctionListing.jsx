import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../../contexts/AuctionContext';
import './AuctionListing.css';

const AuctionListing = () => {
  const { auctions: allAuctions = [], upcomingAuctions: allUpcoming = [], getTimeRemaining } = useAuction();
  const navigate = useNavigate();

  // ----------------------
  // DEMO FALLBACK AUCTIONS
  //-----------------------
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
    },
    {
      id: 'demo2',
      title: 'Sony WH-1000XM5',
      description: 'Noise cancelling headphones.',
      image: 'https://images.unsplash.com/photo-1580894894513-64c9e52f4b25?auto=format&fit=crop&w=800&q=80',
      startingPrice: 250,
      currentBid: 310,
      bids: [{ id: 2, bidder: 'John', amount: 310 }],
      endTime: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      status: 'active',
    },
    {
      id: 'demo3',
      title: 'Vintage Rolex Submariner',
      description: 'Collector’s edition.',
      image: 'https://images.unsplash.com/photo-1600185365483-26d7c7b5d43a?auto=format&fit=crop&w=800&q=80',
      startingPrice: 8200,
      currentBid: 9450,
      bids: [{ id: 3, bidder: 'Michael', amount: 9450 }],
      endTime: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
      status: 'active',
    }
  ];

  // ----------------------
  // DETERMINE WHICH AUCTIONS TO SHOW
  // ----------------------
  const activeRealAuctions = allAuctions.filter(a => a?.status === 'active' && a?.title);
  const upcomingRealAuctions = allUpcoming.filter(a => a?.title);

  // Show real active auctions if available, otherwise show empty state
  const auctionsToShow = activeRealAuctions;

  // ----------------------
  // TIMER
  // ----------------------
  const [timeUpdates, setTimeUpdates] = useState({});
  const [upcomingTimeUpdates, setUpcomingTimeUpdates] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const updates = {};
      auctionsToShow.forEach(a => {
        updates[a.id] = getTimeRemaining?.(a.endTime) || {
          total: Date.parse(a.endTime) - Date.now(),
          seconds: 0,
          minutes: 0,
          hours: 0,
          days: 0,
        };
      });
      setTimeUpdates(updates);

      const upcomingUpdates = {};
      upcomingRealAuctions.forEach(a => {
        upcomingUpdates[a.id] = getTimeRemaining?.(a.startTime) || {
          total: Date.parse(a.startTime) - Date.now(),
          seconds: 0,
          minutes: 0,
          hours: 0,
          days: 0,
        };
      });
      setUpcomingTimeUpdates(upcomingUpdates);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionsToShow, upcomingRealAuctions, getTimeRemaining]);

  const formatTime = (time) => {
    if (!time || time.total <= 0) return 'Ended';

    if (time.days > 0) return `${time.days}d ${time.hours}h`;
    if (time.hours > 0) return `${time.hours}h ${time.minutes}m`;
    return `${time.minutes}m ${time.seconds}s`;
  };

  return (
    <div className="auction-listing">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="auction-header">
        <h1>Bidding Page</h1>
        <p>Browse and bid on exclusive products</p>
      </div>

      {auctionsToShow.length === 0 && upcomingRealAuctions.length === 0 ? (
        <div className="no-auctions">
          <div className="empty-state-icon">🔨</div>
          <h2>No Active Auctions</h2>
          <p>There are currently no live auctions. Check back soon for exciting deals!</p>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {auctionsToShow.length > 0 && (
            <div className="auctions-section">
              <h2 className="section-title">Live Auctions</h2>
              <div className="auctions-grid">
                {auctionsToShow.map(auction => {
                  const timeLeft = timeUpdates[auction.id];
                  const isUrgent = timeLeft?.total > 0 && timeLeft.total < 5 * 60 * 1000;

                  return (
                    <div 
                      key={auction.id}
                      className={`auction-card ${isUrgent ? 'urgent' : ''}`}
                      onClick={() => navigate(`/auctions/${auction.id}`)}
                    >
                      <div className="auction-image">
                        <img src={auction.image} alt={auction.title} />
                        {isUrgent && <div className="urgent-badge">Ending Soon!</div>}
                      </div>

                      <div className="auction-info">
                        <h3>{auction.title}</h3>
                        <p className="auction-description">{auction.description}</p>

                        <div className="auction-details">
                          <div className="bid-info">
                            <span className="label">Current Bid:</span>
                            <span className="current-bid">₹{auction.currentBid}</span>
                          </div>

                          <div className="time-remaining">
                            <span className="label">Time Left:</span>
                            <span className={`time ${isUrgent ? 'urgent-time' : ''}`}>
                              {formatTime(timeLeft)}
                            </span>
                          </div>

                          <div className="bid-count">
                            <span>{auction.bids?.length || 0} bids</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {upcomingRealAuctions.length > 0 && (
            <div className="auctions-section upcoming-section">
              <h2 className="section-title">Upcoming Auctions</h2>
              <div className="auctions-grid">
                {upcomingRealAuctions.map(auction => {
                  const timeUntilStart = upcomingTimeUpdates[auction.id];
                  const isSoon = timeUntilStart?.total > 0 && timeUntilStart.total < 60 * 60 * 1000;

                  return (
                    <div 
                      key={auction.id}
                      className={`auction-card upcoming ${isSoon ? 'urgent' : ''}`}
                      onClick={() => navigate(`/auctions/${auction.id}`)}
                    >
                      <div className="auction-image">
                        <img src={auction.image} alt={auction.title} />
                        {isSoon && <div className="urgent-badge">Starting Soon!</div>}
                      </div>

                      <div className="auction-info">
                        <h3>{auction.title}</h3>
                        <p className="auction-description">{auction.description}</p>

                        <div className="auction-details">
                          <div className="bid-info">
                            <span className="label">Starting Price:</span>
                            <span className="current-bid">₹{auction.startingPrice}</span>
                          </div>

                          <div className="time-remaining">
                            <span className="label">Starts In:</span>
                            <span className={`time ${isSoon ? 'urgent-time' : ''}`}>
                              {formatTime(timeUntilStart)}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuctionListing;
