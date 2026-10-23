import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name, ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    // Ensure the ClientUser record exists in Prisma DB (satisfies foreign key constraint)
    const existingUser = await prisma.clientUser.findUnique({
      where: { id: ownerId }
    });

    if (!existingUser) {
      let email: string | undefined;
      try {
        const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(ownerId);
        if (!authErr && authUser?.user?.email) {
          email = authUser.user.email;
        }
      } catch (err) {
        console.warn('Could not fetch user details from Supabase Auth:', err);
      }

      if (email) {
        const userWithEmail = await prisma.clientUser.findUnique({
          where: { email }
        });

        if (userWithEmail) {
          // If the email was already present under an older ID, update the ID to the current Supabase auth ID
          await prisma.clientUser.update({
            where: { email },
            data: { id: ownerId }
          });
        } else {
          await prisma.clientUser.create({
            data: {
              id: ownerId,
              email,
              tier: 'FREE'
            }
          });
        }
      } else {
        // Fallback unique email if Supabase Auth had no email
        await prisma.clientUser.create({
          data: {
            id: ownerId,
            email: `user_${ownerId}@placeholder.local`,
            tier: 'FREE'
          }
        });
      }
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER'
          }
        }
      }
    });
    res.status(201).json(workspace);
  } catch (error: any) {
    console.error('Failed to create workspace:', error);
    res.status(500).json({ error: error?.message || 'Failed to create workspace' });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        boards: {
          include: {
            screens: {
              include: {
                screen: true
              }
            }
          }
        },
        members: {
          include: {
            user: true
          }
        }
      }
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
};

export const inviteToWorkspace = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: workspaceId } = req.params;
    const { email } = req.body;

    const userToInvite = await prisma.clientUser.findUnique({
      where: { email }
    });

    if (!userToInvite) {
      return res.status(404).json({ error: 'User not found. They must register first.' });
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToInvite.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role: 'MEMBER'
      }
    });

    try {
      await resend.emails.send({
        from: 'Zibo <onboarding@resend.dev>', // Use resend test domain or verified domain
        to: email,
        subject: 'You have been invited to a Workspace!',
        html: `<p>Hello!</p><p>You have been invited to collaborate on a board in Zibo.</p><p>Log in to your account to view the workspace.</p>`
      });
    } catch (emailError) {
      console.error("Failed to send email via Resend:", emailError);
      // We don't want to fail the whole request if just the email fails
    }

    res.status(201).json(newMember);
  } catch (error) {
    console.error("Invite error:", error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = (req.headers['x-user-id'] || req.query.userId || req.body?.userId) as string | undefined;

    const workspace = await prisma.workspace.findUnique({
      where: { id }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (requesterId && workspace.ownerId !== requesterId) {
      return res.status(403).json({ error: 'Only the workspace owner can delete this workspace' });
    }

    // Delete all board screens for boards in this workspace
    const boards = await prisma.board.findMany({
      where: { workspaceId: id },
      select: { id: true }
    });
    const boardIds = boards.map(b => b.id);

    if (boardIds.length > 0) {
      await prisma.boardScreen.deleteMany({
        where: { boardId: { in: boardIds } }
      });
      await prisma.board.deleteMany({
        where: { workspaceId: id }
      });
    }

    // Delete members
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: id }
    });

    // Delete the workspace itself
    await prisma.workspace.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
};
