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

// Helper function to approve user and send email
export const executeUserApproval = async (email: string) => {
  let clientUser = await prisma.clientUser.findUnique({ where: { email } });

  if (clientUser && clientUser.status === 'ACTIVE') {
    return { alreadyApproved: true };
  }

  // Generate random password
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

  // Check if user already exists in Supabase Auth
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingAuthUser = userList?.users?.find((u: any) => u.email === email);

  let authUserId = existingAuthUser?.id;

  if (!authUserId) {
    // Create user in Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      throw new Error(authError.message || 'Failed to create user in Auth');
    }
    authUserId = userData?.user?.id;
  }

  if (!authUserId) {
    throw new Error('Could not obtain auth user ID');
  }

  // If clientUser had a placeholder ID (from waitlist pre-reg), clean it up before upserting with authUserId
  if (clientUser && clientUser.id !== authUserId) {
    await prisma.clientUser.delete({ where: { id: clientUser.id } });
  }

  // Upsert ClientUser in Prisma DB so user can immediately create workspaces/collections
  clientUser = await prisma.clientUser.upsert({
    where: { id: authUserId },
    update: {
      email,
      status: 'ACTIVE',
    },
    create: {
      id: authUserId,
      email,
      name: clientUser?.name || null,
      phone: clientUser?.phone || null,
      status: 'ACTIVE',
      tier: 'FREE',
      role: 'VIEWER',
    },
  });

  // Send email via Resend
  try {
    if (!resend) {
      console.warn("Skipping email send: RESEND_API_KEY is not configured.");
    } else {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Zibo <heyz@zibo.design>';
      const { data, error: resendError } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to Zibo Beta!',
        html: `
          <h2>You've been approved!</h2>
          <p>Hi ${clientUser.name || 'there'},</p>
          <p>Your beta access for Zibo is now active.</p>
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

  return { success: true };
};

// Check if auto approval is enabled
export const isAutoApprovalEnabled = async (): Promise<boolean> => {
  try {
    const setting = await prisma.integration.findUnique({
      where: { provider: 'USER_REGISTRATION_SETTINGS' },
    });
    if (setting && setting.config && typeof (setting.config as any).autoApprove === 'boolean') {
      return (setting.config as any).autoApprove;
    }
  } catch (err) {
    console.warn('Error reading USER_REGISTRATION_SETTINGS from DB:', err);
  }
  return process.env.AUTO_APPROVE_USERS === 'true';
};

export const registerWaitlist = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await prisma.clientUser.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return res.status(400).json({ message: 'Email already registered and active' });
      }
      return res.status(400).json({ message: 'Email already registered on waitlist' });
    }

    const autoApprove = await isAutoApprovalEnabled();
    if (autoApprove) {
      try {
        await executeUserApproval(email);
        const updated = await prisma.clientUser.update({
          where: { email },
          data: { name, phone },
        });
        return res.status(201).json({ ...updated, autoApproved: true });
      } catch (approveErr: any) {
        console.error('Auto-approval error:', approveErr);
        const crypto = require('crypto');
        const fallbackPending = await prisma.clientUser.create({
          data: {
            id: crypto.randomUUID(),
            name,
            email,
            phone,
            status: 'WAITLIST_PENDING',
            role: 'VIEWER',
          },
        });
        return res.status(201).json({ ...fallbackPending, autoApproved: false, error: approveErr.message });
      }
    }

    const crypto = require('crypto');
    const pendingUser = await prisma.clientUser.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        status: 'WAITLIST_PENDING',
        role: 'VIEWER',
      },
    });

    res.status(201).json(pendingUser);
  } catch (error) {
    console.error('Error registering waitlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getApprovalSettings = async (req: Request, res: Response) => {
  try {
    const autoApprove = await isAutoApprovalEnabled();
    res.status(200).json({ autoApprove });
  } catch (error) {
    console.error('Error fetching approval settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateApprovalSettings = async (req: Request, res: Response) => {
  try {
    const { autoApprove } = req.body;
    if (typeof autoApprove !== 'boolean') {
      return res.status(400).json({ message: 'autoApprove must be a boolean' });
    }

    await prisma.integration.upsert({
      where: { provider: 'USER_REGISTRATION_SETTINGS' },
      update: { config: { autoApprove } },
      create: {
        provider: 'USER_REGISTRATION_SETTINGS',
        config: { autoApprove },
      },
    });

    res.status(200).json({ autoApprove, message: `Auto approval ${autoApprove ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('Error updating approval settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const clientUser = await prisma.clientUser.findUnique({ where: { email } });
    if (!clientUser) {
      return res.status(404).json({ message: 'User record not found' });
    }

    if (clientUser.status === 'ACTIVE') {
      return res.status(400).json({ message: 'User already approved' });
    }

    await executeUserApproval(email);

    res.status(200).json({ message: 'User approved and email sent.' });
  } catch (error: any) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getWaitlist = async (req: Request, res: Response) => {
  try {
    const users = await prisma.clientUser.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching waitlist users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const clientUser = await prisma.clientUser.findUnique({ where: { email } });
    if (!clientUser) {
      return res.status(404).json({ message: 'User record not found' });
    }

    if (clientUser.status === 'REJECTED') {
      return res.status(400).json({ message: 'User already rejected' });
    }

    await prisma.clientUser.update({
      where: { email },
      data: { status: 'REJECTED' },
    });

    res.status(200).json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
