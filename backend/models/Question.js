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
    imageUrl: {
      type: String,
      trim: true,
      default: undefined
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

questionSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Question', questionSchema);
