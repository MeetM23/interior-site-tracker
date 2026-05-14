const Counter = require('../models/Counter');

/**
 * Atomically generates a custom ID string.
 * @param {string} prefix - The entity prefix (e.g., 'USER', 'PRJ', 'CLT').
 * @param {number} padding - The amount of zero-padding (default 4).
 * @returns {string} - Formalized ID like 'PRJ-0001'.
 */
const generateId = async (prefix, padding = 4) => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  const formattedSeq = counter.seq.toString().padStart(padding, '0');
  return `${prefix}-${formattedSeq}`;
};

module.exports = { generateId };
