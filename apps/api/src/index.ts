import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db/prisma';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import appRoutes from './routes/app.routes';
import flowRoutes from './routes/flow.routes';
import uiElementRoutes from './routes/uiElement.routes';
import patternRoutes from './routes/pattern.routes';
import screenRoutes from './routes/screen.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import searchRoutes from './routes/search.routes';
import authRoutes from './routes/auth.routes';
import exportRoutes from './routes/export.routes';
import appRequestRoutes from './routes/app-request.routes';
import configRoutes from './routes/config.routes';
import usersRoutes from './routes/users.routes';
import quotaRoutes from './routes/quota.routes';
import workspaceRoutes from './routes/workspace.routes';
import boardRoutes from './routes/board.routes';
import mobbinRoutes from './routes/mobbin.routes';
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the UX Library API!' });
});

// API Routes
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/subcategories', subcategoryRoutes);
app.use('/api/v1/apps', appRoutes);
app.use('/api/v1/flows', flowRoutes);
app.use('/api/v1/ui-elements', uiElementRoutes);
app.use('/api/v1/patterns', patternRoutes);
app.use('/api/v1/screens', screenRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/app-requests', appRequestRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/quota', quotaRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/boards', boardRoutes);
app.use('/api/v1/mobbin', mobbinRoutes);

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-board', (boardId: string) => {
    socket.join(`board-${boardId}`);
    console.log(`Socket ${socket.id} joined board-${boardId}`);
  });

  socket.on('chat-message', async (data: { boardId: string, message: any }) => {
    console.log(`Received message on board ${data.boardId}: ${data.message.content}`);
    
    try {
      // 1. Fetch current board to get existing messages and screen context
      const board = await prisma.board.findUnique({ 
        where: { id: data.boardId },
        include: {
          screens: {
            include: {
              screen: {
                include: { app: true }
              }
            }
          }
        }
      });
      
      let currentMessages: any[] = [];
      if (board && board.canvasState) {
        currentMessages = board.canvasState as any[];
      }
      if (!Array.isArray(currentMessages)) currentMessages = [];
      
      // 2. Append user message
      currentMessages.push(data.message);
      
      await prisma.board.update({
        where: { id: data.boardId },
        data: { canvasState: currentMessages }
      });
      
      // Broadcast the user's message to everyone else
      socket.to(`board-${data.boardId}`).emit('chat-message', data.message);

      // If they mentioned the AI, trigger an AI response
      if (data.message.content.toLowerCase().includes('@ai')) {
        // Broadcast typing indicator
        io.to(`board-${data.boardId}`).emit('ai-typing', true);
        
        let screenContext = "The board has no screens saved yet.";
        if (board && board.screens && board.screens.length > 0) {
          const screenNames = board.screens.map((s: any) => `"${s.screen.name}" from the app ${s.screen.app?.name || 'Unknown'}`).join(', ');
          screenContext = `The user has saved the following UI screens to this board for inspiration: ${screenNames}. Use this context if they ask questions about the board's designs.`;
        }

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 1024,
          system: `You are Baselyn AI, a helpful, witty, and concise AI assistant built into the Baselyn design platform workspace. You help teams collaborate and answer questions.\n\nContext about the current workspace: ${screenContext}`,
          messages: [
            { role: 'user', content: data.message.content }
          ]
        });

        const aiText = response.content
          .filter((block) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n') || "Sorry, I couldn't generate a response.";
          
        console.log("AI Raw Response Content:", JSON.stringify(response.content));

        const aiMessage = {
          id: Date.now().toString(),
          content: aiText,
          user: { email: "Baselyn AI" },
          createdAt: new Date().toISOString()
        };
        
        // Append AI message and save
        currentMessages.push(aiMessage);
        await prisma.board.update({
          where: { id: data.boardId },
          data: { canvasState: currentMessages }
        });

        // Broadcast AI response to everyone in the room (including sender)
        io.to(`board-${data.boardId}`).emit('chat-message', aiMessage);
      }
    } catch (error) {
      console.error("DB/AI Error:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Trigger restart 9
