import app from './server';
import Database from './config/db.config';
import Logger from './config/logger.config';
import { validateEnv } from './config/env.config';
import fs from 'fs';
import path from 'path';
import { FileSystemUtil } from './lib/fs.util';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const env = validateEnv();
const port = env.PORT;

async function startServer() {
  try {
    await Database.getInstance().connect();
    
    const cleanupTimer: any = FileSystemUtil.schedulePeriodicCleanup();

    const server = app.listen(port, () => {
      Logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
      Logger.info(`Access API at http://localhost:${port}/api/v1`);
    });
    
    const gracefulShutdown = async (signal: string) => {
      Logger.info(`${signal} signal received: closing HTTP server`);
      
      clearInterval(cleanupTimer);

      server.close(async () => {
        Logger.info('HTTP server closed');
        await Database.getInstance().disconnect();
        process.exit(0);
      });

      setTimeout(() => {
        Logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

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

