import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name, ownerId } = req.body;
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace' });
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
        boards: true
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
        from: 'Baselyn <onboarding@resend.dev>', // Use resend test domain or verified domain
        to: email,
        subject: 'You have been invited to a Workspace!',
        html: `<p>Hello!</p><p>You have been invited to collaborate on a board in Baselyn.</p><p>Log in to your account to view the workspace.</p>`
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
