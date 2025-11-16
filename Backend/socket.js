const { Server } = require("socket.io");
const Bid = require('./models/bids');
const Product = require('./models/product');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('joinAuctionRoom', (productId) => {
      socket.join(productId);
      console.log(`User ${socket.id} joined auction room ${productId}`);
    });

    socket.on('leaveAuctionRoom', (productId) => {
      socket.leave(productId);
      console.log(`User ${socket.id} left auction room ${productId}`);
    });

    socket.on('placeBid', async ({ productId, bidAmount, userId }) => {
      try {
        const newBid = new Bid({
          product: productId,
          user: userId,
          amount: bidAmount,
        });

        const query = {
          _id: productId,
          'auctionDetails.status': 'Active',
          'auctionDetails.endTime': { $gt: new Date() },
          'sellerId': { $ne: userId }, 
          $or: [
            { 'auctionDetails.currentBid': { $lt: bidAmount } },
            {
              'auctionDetails.currentBid': { $exists: false },
              'auctionDetails.startPrice': { $lt: bidAmount }
            }
          ]
        };

        const update = {
          $set: {
            'auctionDetails.currentBid': bidAmount,
            'auctionDetails.highestBidder': userId
          },
          $push: { 'auctionDetails.bidHistory': newBid._id }
        };

        const updatedProduct = await Product.findOneAndUpdate(query, update, { new: false });

        if (!updatedProduct) {

          return socket.emit('bidError', 'Your bid was not high enough or the auction has ended.');
        }

        await newBid.save();

        await newBid.populate('user', 'name');

        io.to(productId).emit('bidUpdate', {
          currentBid: bidAmount,
          highestBidder: newBid.user.name,
          bid: newBid
        });

      } catch (error) {
        console.error("Bid error:", error);
        socket.emit('bidError', 'An error occurred while placing your bid.');
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  setInterval(checkEndedAuctions, 15000); //check auction end time every 15 secs
}

async function checkEndedAuctions() {
  try {
    const now = new Date();
    const endedAuctions = await Product.find({
      'auctionDetails.status': 'Active',
      'auctionDetails.endTime': { $lte: now }
    });

    for (const auction of endedAuctions) {
      await Product.updateOne(
        { _id: auction._id },
        { $set: { 'auctionDetails.status': 'Completed' } }
      );

      io.to(auction._id.toString()).emit('auctionEnded', {
        productId: auction._id,
        winnerId: auction.auctionDetails.highestBidder,
        finalPrice: auction.auctionDetails.currentBid
      });

      console.log(`Auction ${auction.title} has ended.`);

      //Upcoming Feature: New order for winning bidder automatically created
    }
  } catch (error) {
    console.error("Error checking ended auctions:", error);
  }
}

module.exports = { initSocket, io };