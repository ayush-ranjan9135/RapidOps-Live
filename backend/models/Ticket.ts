import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdBy: string; // Just a string ID for mock users
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    createdBy: { type: String, required: true },
    assignedTo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITicket>('Ticket', TicketSchema);
