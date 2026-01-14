const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    /* ======================
       BASIC INVOICE INFO
    =======================*/
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    /* ======================
       INVOICE ITEMS
    =======================*/
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    /* ======================
       AMOUNTS
    =======================*/
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================
       PAYMENT DETAILS
    =======================*/
    paymentMethod: {
      type: String,
      enum: [
        'Cash',
        'Bank Transfer',
        'Credit Card',
        'Debit Card',
        'Cheque',
        'Online Payment',
        'Other',
      ],
      default: 'Other',
    },

    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },

    paymentDate: {
      type: Date,
    },

    transactionId: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    /* ======================
       META
    =======================*/
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================
   INDEXES
======================*/
paymentSchema.index({ invoiceNumber: 1 });
paymentSchema.index({ project: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
