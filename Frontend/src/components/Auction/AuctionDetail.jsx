import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuction } from "../../contexts/AuctionContext.jsx";
import "./AuctionDetail.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions: allAuctions = [], getTimeRemaining, placeBid, getAuctionById, joinAuctionRoom, leaveAuctionRoom } = useAuction();

  // prefer real auction from context
  const realAuction = allAuctions.find(a => a?.id === id && a?.title);
  const [localAuction, setLocalAuction] = useState(realAuction || null);
  const [loading, setLoading] = useState(!realAuction);

  // Fetch auction if not in context
  useEffect(() => {
    const fetchAuction = async () => {
      if (!realAuction && id) {
        try {
          setLoading(true);
          console.log('🔄 Fetching auction:', id);
          const auction = await getAuctionById(id);
          console.log('✅ Fetched auction:', auction);
          setLocalAuction(auction);
        } catch (err) {
          console.error('❌ Error fetching auction:', err);
          alert('Failed to load auction');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAuction();
  }, [id, realAuction, getAuctionById]);

  // Join the auction room for live bid updates
  useEffect(() => {
    if (!id) return;

    joinAuctionRoom?.(id);

    return () => {
      leaveAuctionRoom?.(id);
    };
  }, [id, joinAuctionRoom, leaveAuctionRoom]);

  // keep local in sync if context updates
  useEffect(() => {
    if (realAuction) {
      setLocalAuction(realAuction);
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="auction-detail">
        <div className="loading">Loading auction...</div>
      </div>
    );
  }

  if (!localAuction) {
    return (
      <div className="auction-detail">
        <div className="loading">
          <h2>Auction Not Found</h2>
          <button className="back-button" onClick={() => navigate('/auctions')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  const minBid = (localAuction.currentBid || localAuction.startingPrice) + (localAuction.minIncrement || 10);
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
      setMsg({ type: "error", text: `Minimum bid is ₹${minBid}` });
      return;
    }

    // Place bid via socket (real-time)
    placeBid(localAuction.id, amount);
    setMsg({ type: "success", text: "Bid placed successfully!" });
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
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Auctions
      </button>

      <div className="auction-detail-container">
        <div className="auction-image-section">
          <img src={localAuction.image} alt={localAuction.title} />
        </div>

        <div className="auction-content">
          <h1>{localAuction.title}</h1>
          <p className="description">{localAuction.description}</p>

          <div className={`timer ${isEnded ? 'ended' : timeLeft?.total < 300000 ? 'urgent' : ''}`}>
            <div className="timer-label">{isEnded ? "Auction Ended" : "Time Remaining"}</div>
            <div className="timer-value">{formatTime(timeLeft)}</div>
          </div>

          <div className="current-bid-info">
            <div className="bid-label">Current Bid</div>
            <div className="bid-amount">₹{localAuction.currentBid || localAuction.startingPrice}</div>
            {localAuction.currentBidder && <div className="current-bidder">Highest bidder: {localAuction.currentBidder}</div>}
          </div>

          <div className="bid-section">
            {!isEnded ? (
              <form onSubmit={submitBid} className="bid-form">
                <div className="bid-input-group">
                  <label>Your Bid (Min: ₹{minBid})</label>
                  <input
                    type="number"
                    step={localAuction.minIncrement || 10}
                    min={minBid}
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    placeholder={minBid}
                  />
                </div>
                <button type="submit" className="bid-button">Place Bid</button>
                {msg && <div className={msg.type === "error" ? "error-message" : "success-message"}>{msg.text}</div>}
              </form>
            ) : (
              <div className="ended-message">
                <h3>Auction Ended</h3>
                {localAuction.currentBidder && <p>Winner: {localAuction.currentBidder} with ₹{localAuction.currentBid}</p>}
              </div>
            )}
          </div>

          <div className="bid-history">
            <h3>Bid History ({(localAuction.bids || []).length})</h3>
            <div className="bids-list">
              {(localAuction.bids || []).length === 0 ? (
                <div className="bid-item">No bids yet</div>
              ) : (
                localAuction.bids.map((b, idx) => (
                  <div key={b.id} className={`bid-item ${idx === 0 ? 'latest' : ''}`}>
                    <span className="bid-bidder">{b.bidder}</span>
                    <span className="bid-amount">₹{b.amount}</span>
                    <span className="bid-time">{new Date(b.time).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
