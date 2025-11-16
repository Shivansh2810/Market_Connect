import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuctionDetailPage.css';
import { getAuctionById } from '../../../api/auction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faDollarSign, faUser, faGavel } from '@fortawesome/free-solid-svg-icons';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const loadAuction = async () => {
      try {
        setLoading(true);
        const data = await getAuctionById(id);
        setAuction(data);
      } catch (err) {
        console.error('Error loading auction:', err);
        setError('Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };

    loadAuction();
  }, [id]);

  // Update time remaining every second
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      const now = new Date();
      const endTime = new Date(auction.auctionDetails.endTime);
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('Auction Ended');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const handlePlaceBid = async () => {
    if (!user) {
      alert('Please login to place a bid');
      navigate('/login');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (!bidAmount || bidValue <= auction.auctionDetails.currentBid) {
      alert(`Bid must be greater than ₹${auction.auctionDetails.currentBid}`);
      return;
    }

    // TODO: Implement bid submission through socket or API
    alert('Bid placement coming soon! Your bid: ₹' + bidValue);
    setBidAmount('');
  };

  if (loading) {
    return <div className="auction-detail-loading">Loading auction...</div>;
  }

  if (error || !auction) {
    return (
      <div className="auction-detail-error">
        <p>{error || 'Auction not found'}</p>
        <button onClick={() => navigate('/auctions')}>Back to Auctions</button>
      </div>
    );
  }

  const isAuctionEnded = new Date(auction.auctionDetails.endTime) < new Date();
  const canBid = !isAuctionEnded && auction.auctionDetails.status === 'Active';

  return (
    <div className="auction-detail-container">
      <div className="auction-detail-content">
        {/* Main Image */}
        <div className="auction-image-section">
          <img
            src={auction.images?.[0]?.url || 'https://via.placeholder.com/600?text=No+Image'}
            alt={auction.title}
            className="main-image"
          />
          {auction.images && auction.images.length > 1 && (
            <div className="thumbnail-images">
              {auction.images.map((img, idx) => (
                <img key={idx} src={img.url} alt={`${auction.title} ${idx}`} className="thumbnail" />
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="auction-details-section">
          <h1>{auction.title}</h1>

          <div className="status-info">
            <span className={`status-badge ${auction.auctionDetails.status.toLowerCase()}`}>
              {auction.auctionDetails.status}
            </span>
            <span className={`time-badge ${isAuctionEnded ? 'ended' : 'active'}`}>
              <FontAwesomeIcon icon={faClock} /> {timeRemaining}
            </span>
          </div>

          <div className="auction-info-grid">
            <div className="info-card">
              <div className="info-label">Starting Price</div>
              <div className="info-value">
                <FontAwesomeIcon icon={faDollarSign} />
                ₹{auction.auctionDetails.startPrice}
              </div>
            </div>

            <div className="info-card">
              <div className="info-label">Current Bid</div>
              <div className="info-value highlight">
                <FontAwesomeIcon icon={faDollarSign} />
                ₹{auction.auctionDetails.currentBid}
              </div>
            </div>

            <div className="info-card">
              <div className="info-label">Total Bids</div>
              <div className="info-value">
                <FontAwesomeIcon icon={faGavel} />
                {auction.auctionDetails.bidHistory?.length || 0}
              </div>
            </div>

            <div className="info-card">
              <div className="info-label">Highest Bidder</div>
              <div className="info-value">
                <FontAwesomeIcon icon={faUser} />
                {auction.auctionDetails.highestBidder?.name || 'No bids yet'}
              </div>
            </div>
          </div>

          <div className="time-info">
            <div className="time-row">
              <span className="label">Auction Starts:</span>
              <span className="value">{new Date(auction.auctionDetails.startTime).toLocaleString()}</span>
            </div>
            <div className="time-row">
              <span className="label">Auction Ends:</span>
              <span className="value">{new Date(auction.auctionDetails.endTime).toLocaleString()}</span>
            </div>
          </div>

          {canBid && (
            <div className="bidding-section">
              <h3>Place Your Bid</h3>
              <div className="bid-input-group">
                <span className="currency">₹</span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Enter amount above ₹${auction.auctionDetails.currentBid}`}
                  min={auction.auctionDetails.currentBid + 1}
                  disabled={!user}
                />
                <button
                  className="btn-bid"
                  onClick={handlePlaceBid}
                  disabled={!user || !bidAmount}
                >
                  <FontAwesomeIcon icon={faGavel} /> Place Bid
                </button>
              </div>
              {!user && (
                <p className="login-prompt">
                  <strong>Sign in required</strong> to place a bid
                </p>
              )}
            </div>
          )}

          {isAuctionEnded && (
            <div className="auction-ended-message">
              <h3>Auction Has Ended</h3>
              {auction.auctionDetails.highestBidder && (
                <p>Final Winner: <strong>{auction.auctionDetails.highestBidder.name}</strong></p>
              )}
              <p>Final Price: <strong>₹{auction.auctionDetails.currentBid}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Product Description */}
      <div className="product-description-section">
        <h2>Product Description</h2>
        <p>{auction.description}</p>

        {auction.specs && Object.keys(auction.specs).length > 0 && (
          <div className="specs-section">
            <h3>Specifications</h3>
            <table className="specs-table">
              <tbody>
                {Object.entries(auction.specs).map(([key, value]) => (
                  <tr key={key}>
                    <td className="spec-key">{key}</td>
                    <td className="spec-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="seller-info">
          <h3>Seller Information</h3>
          <p><strong>Seller:</strong> {auction.sellerId?.name || 'Unknown'}</p>
        </div>
      </div>

      {/* Bid History */}
      {auction.auctionDetails.bidHistory && auction.auctionDetails.bidHistory.length > 0 && (
        <div className="bid-history-section">
          <h2>Bid History</h2>
          <div className="bid-history-list">
            {auction.auctionDetails.bidHistory.map((bid, idx) => (
              <div key={idx} className="bid-item">
                <div className="bid-info">
                  <span className="bidder-name">{bid.user?.name || 'Anonymous'}</span>
                  <span className="bid-time">{new Date(bid.createdAt).toLocaleString()}</span>
                </div>
                <div className="bid-amount">₹{bid.amount}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetailPage;
