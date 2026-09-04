import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Polyfill for Supabase realtime in older Node versions
(global as any).WebSocket = WebSocket;

import { Resend } from 'resend';
const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
const resend = resendKey ? new Resend(resendKey) : null;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export const registerWaitlist = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await prisma.waitlist.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered on waitlist' });
    }

    const waitlist = await prisma.waitlist.create({
      data: { name, email, phone },
    });

    res.status(201).json(waitlist);
  } catch (error) {
    console.error('Error registering waitlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const waitlist = await prisma.waitlist.findUnique({ where: { email } });
    if (!waitlist) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }

    if (waitlist.status === 'APPROVED') {
      return res.status(400).json({ message: 'User already approved' });
    }

    // Generate random password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

    // Create user in Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(500).json({ message: 'Failed to create user in Auth', error: authError.message });
    }

    // Update waitlist status
    await prisma.waitlist.update({
      where: { email },
      data: { status: 'APPROVED' },
    });

    // Send email via Resend
    try {
      if (!resend) {
        console.warn("Skipping email send: RESEND_API_KEY is not configured.");
      } else {
        const { data, error: resendError } = await resend.emails.send({
        from: 'BenchmarX <hello@baselyn.co>',
        to: email,
        subject: 'Welcome to BenchmarX Beta!',
        html: `
          <h2>You've been approved!</h2>
          <p>Hi ${waitlist.name},</p>
          <p>Your beta access for BenchmarX is now active.</p>
          <p>Here are your temporary login credentials:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
          <p>Please log in and change your password as soon as possible.</p>
        `,
      });
      
      if (resendError) {
        console.warn('Email sending failed (Resend API):', resendError.message || resendError);
        } else {
          console.log('Email sent successfully:', data);
        }
      }
    } catch (emailErr) {
      console.error('Email sending exception:', emailErr);
    }

    res.status(200).json({ message: 'User approved and email sent.' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getWaitlist = async (req: Request, res: Response) => {
  try {
    const waitlist = await prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(waitlist);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const waitlist = await prisma.waitlist.findUnique({ where: { email } });
    if (!waitlist) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }

    if (waitlist.status === 'REJECTED') {
      return res.status(400).json({ message: 'User already rejected' });
    }

    await prisma.waitlist.update({
      where: { email },
      data: { status: 'REJECTED' },
    });

    res.status(200).json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
