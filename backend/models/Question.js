import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => options.length === 4,
        message: 'A question must have exactly four options.'
      }
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Variation TODO: add exactly one approved extra field if needed.
    // Examples: category, imageUrl, explanation, timeLimitSeconds.
    variationMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);

