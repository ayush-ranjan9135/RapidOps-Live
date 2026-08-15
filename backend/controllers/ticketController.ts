import { Request, Response } from 'express';
import { z } from 'zod';
import Ticket from '../models/Ticket';
import { ticketLockService } from '../services/ticketLockService';

const ticketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
});

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    
    // We should also return the current lock state for all tickets so the initial load is accurate
    const ticketsWithLocks = tickets.map(ticket => {
      const lock = ticketLockService.getLock(ticket._id.toString());
      return {
        ...ticket.toObject(),
        lock: lock ? { agentId: lock.agentId, agentName: lock.agentName } : null
      };
    });

    res.json({ success: true, data: ticketsWithLocks });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch tickets' } });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } });
    }
    
    const lock = ticketLockService.getLock(ticket._id.toString());
    
    res.json({ success: true, data: { ...ticket.toObject(), lock: lock ? { agentId: lock.agentId, agentName: lock.agentName } : null } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch ticket' } });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const agentId = req.headers['x-agent-id'] as string; // Mock auth via header
    if (!agentId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing agent ID' } });
    }

    const validatedData = ticketSchema.parse(req.body);
    const newTicket = new Ticket({
      ...validatedData,
      createdBy: agentId
    });

    await newTicket.save();

    // Broadcast creation to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_created', newTicket);
    }

    res.status(201).json({ success: true, data: newTicket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: (error as any).errors } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create ticket' } });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const agentId = req.headers['x-agent-id'] as string;
    if (!agentId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing agent ID' } });
    }

    // Verify lock ownership before allowing update
    const lock = ticketLockService.getLock(req.params.id as string);
    if (lock && lock.agentId !== agentId) {
      return res.status(403).json({ success: false, error: { code: 'LOCKED', message: `Ticket is currently locked by ${lock.agentName}` } });
    }

    const validatedData = ticketSchema.partial().parse(req.body);
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: (error as any).errors } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update ticket' } });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    // Omitting lock check for delete to keep it simple, but we could add it
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete ticket' } });
  }
};
