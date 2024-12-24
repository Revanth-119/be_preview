import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
  Institute: { type: String, required: true, index: true },
  'Academic Program Name': {
    type: String,
    required: true,
    index: true,
  },
  Quota: { type: String, required: true },
  'Seat Type': { type: String, required: true, index: true },
  Gender: { type: String, required: true, index: true },
  'Opening Rank': { type: Number, required: true },
  'Closing Rank': { type: Number, required: true },
  Year: { type: Number, required: true },
  Round: { type: Number, required: true },
});

collegeSchema.index({ seatType: 1, gender: 1, openingRank: 1, closingRank: 1 });

export const College = mongoose.model('College', collegeSchema);
