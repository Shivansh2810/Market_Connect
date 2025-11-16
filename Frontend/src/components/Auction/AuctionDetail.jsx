// src/components/auction/AuctionDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuction } from "../../contexts/AuctionContext.jsx";
import "./AuctionDetail.css";

const demoAuctions = [
  {
    id: "demo1",
    title: 'Apple MacBook Pro 16"',
    description: "M3 Pro chip, 16GB RAM, 512GB SSD — demo",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    startingPrice: 1200,
    currentBid: 1450,
    minIncrement: 20,
    bids: [{ id: "1", bidder: "Alice", amount: 1450, time: new Date().toISOString() }],
    endTime: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
    status: "active"
  },
  {
    id: "demo2",
    title: "Sony WH-1000XM5",
    description: "Demo headphones",
    image:
      "https://images.unsplash.com/photo-1580894894513-64c9e52f4b25?auto=format&fit=crop&w=800&q=80",
    startingPrice: 250,
    currentBid: 310,
    minIncrement: 10,
    bids: [{ id: "1", bidder: "John", amount: 310, time: new Date().toISOString() }],
    endTime: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    status: "active"
  }
];

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions: allAuctions = [], getTimeRemaining, placeBid } = useAuction();

  // prefer real auction from context
  const realAuction = allAuctions.find(a => a?.id === id && a?.title);
  const [localAuction, setLocalAuction] = useState(realAuction || demoAuctions.find(d => d.id === id) || null);
  const isReal = !!realAuction;

  // keep local in sync if context updates
  useEffect(() => {
    if (realAuction) setLocalAuction(realAuction);
  }, [realAuction]);

  // timer
  const [timeLeft, setTimeLeft] = useState(() => (localAuction ? getTimeRemaining(localAuction.endTime) : null));
  useEffect(() => {
    if (!localAuction) return;
    const update = () => {
      const t = getTimeRemaining(localAuction.endTime);
      setTimeLeft(t);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [localAuction, getTimeRemaining]);

  if (!localAuction) {
    return (
      <div className="auction-detail">
        <div className="loading">Loading auction...</div>
      </div>
    );
  }

  const minBid = (localAuction.currentBid || localAuction.startingPrice) + (localAuction.minIncrement || 1);
  const [bidInput, setBidInput] = useState("");
  const [msg, setMsg] = useState(null);

  const submitBid = e => {
    e.preventDefault();
    const amount = Number(bidInput);
    if (!amount || isNaN(amount)) {
      setMsg({ type: "error", text: "Enter a valid number" });
      return;
    }
    if (amount < minBid) {
      setMsg({ type: "error", text: `Minimum bid is $${minBid}` });
      return;
    }

    if (isReal) {
      // place bid in context (will update auctions and persist)
      placeBid(localAuction.id, amount);
      setMsg({ type: "success", text: "Bid placed (context)!" });
      setBidInput("");
      return;
    }
    // demo-only: update local state to simulate success
    const newBid = { id: Date.now().toString(), bidder: "You", amount, time: new Date().toISOString() };
    setLocalAuction(prev => {
      let newEnd = prev.endTime;
      const secondsLeft = (new Date(prev.endTime) - new Date()) / 1000;
      if (secondsLeft > 0 && secondsLeft <= 10) newEnd = new Date(Date.now() + 10 * 1000).toISOString();
      return { ...prev, currentBid: amount, currentBidder: "You", bids: [newBid, ...(prev.bids || [])], endTime: newEnd };
    });
    setMsg({ type: "success", text: "Bid placed (demo)!" });
    setBidInput("");
  };

  const formatTime = t => {
    if (!t) return "Loading...";
    if (t.total <= 0) return "Ended";
    if (t.days > 0) return `${t.days}d ${t.hours}h ${t.minutes}m`;
    if (t.hours > 0) return `${t.hours}h ${t.minutes}m ${t.seconds}s`;
    return `${t.minutes}m ${t.seconds}s`;
  };

  const isEnded = timeLeft && timeLeft.total <= 0;

  return (
    <div className="auction-detail">
      <button className="back-button" onClick={() => navigate("/auctions")}>
        ← Back to Auctions
      </button>

      <div className="auction-detail-container">
        <div className="auction-image-section">
          <img src={localAuction.image} alt={localAuction.title} />
        </div>

        <div className="auction-content">
          <h1>{localAuction.title}</h1>
          <p className="description">{localAuction.description}</p>

          <div className="timer">
            <div className="timer-label">{isEnded ? "Auction Ended" : "Time Remaining"}</div>
            <div className="timer-value">{formatTime(timeLeft)}</div>
          </div>

          <div className="current-bid-info">
            <div className="bid-label">Current Bid</div>
            <div className="bid-amount">${localAuction.currentBid || localAuction.startingPrice}</div>
            {localAuction.currentBidder && <div className="current-bidder">Highest bidder: {localAuction.currentBidder}</div>}
          </div>

          <div className="bid-section">
            {!isEnded ? (
              <form onSubmit={submitBid} className="bid-form">
                <form onSubmit={submitBid} className="bid-form">
  <div className="bid-input-group">
    <label>Your Bid (Min: ${minBid})</label>

    <input
      type="number"
      step={localAuction.minIncrement || 1}
      min={minBid}
      value={bidInput}
      onChange={(e) => setBidInput(e.target.value)}
      placeholder={minBid}
    />
  </div>

  <button type="submit" className="bid-button">
    Place Bid
  </button>
</form>

                <button type="submit" className="bid-button">Place Bid</button>
                {msg && <div className={msg.type === "error" ? "error-message" : "success-message"}>{msg.text}</div>}
              </form>
            ) : (
              <div className="ended-message">
                <h3>Auction Ended</h3>
                {localAuction.currentBidder && <p>Winner: {localAuction.currentBidder} with ${localAuction.currentBid}</p>}
              </div>
            )}
          </div>

          <div className="bid-history">
            <h3>Bid History ({(localAuction.bids || []).length})</h3>
            <ul>
              {(localAuction.bids || []).length === 0 ? <li>No bids yet</li> : localAuction.bids.map(b => <li key={b.id}>{b.bidder}: ${b.amount} <small>({new Date(b.time).toLocaleTimeString()})</small></li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
