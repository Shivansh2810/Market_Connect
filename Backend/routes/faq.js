const express = require("express");
const router = express.Router();
const Faq = require("../models/Faq");

// GET /api/faqs - public list of active FAQs
router.get("/", async (req, res) => {
  try {
    const faqs = await Faq.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.json({ faqs });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// POST /api/faqs - simple admin create (optional; protect later)
router.post("/", async (req, res) => {
  try {
    const { question, answer, tags, keywords, isActive } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "question and answer are required" });
    }
    const faq = await Faq.create({ question, answer, tags, keywords, isActive });
    res.status(201).json({ faq });
  } catch (err) {
    console.error("Error creating FAQ:", err);
    res.status(500).json({ error: "Failed to create FAQ" });
  }
});

module.exports = router;
