import app from './server';
import Database from './config/db.config';
import Logger from './config/logger.config';
import validateEnv from './config/env.config';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Validate environment before starting
const env = validateEnv();
const port = env.PORT;

async function startServer() {
  try {
    await Database.getInstance().connect();
    
    const server = app.listen(port, () => {
      Logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
      Logger.info(`Access API at http://localhost:${port}/api/v1`);
    });
    
    // Implement graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      Logger.info(`${signal} signal received: closing HTTP server`);
      
      server.close(async () => {
        Logger.info('HTTP server closed');
        await Database.getInstance().disconnect();
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        Logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (error) {
    Logger.error(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

const server = startServer();

export default server;