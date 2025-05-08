import app from './server';
import Database from './config/db.config';
import Logger from './config/logger.config';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const port = process.env.PORT || 3001;

async function startServer() {
  try {
    await Database.getInstance().connect();
    
    const server = app.listen(port, () => {
      Logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
    });
    
    process.on('SIGTERM', async () => {
      Logger.info('SIGTERM signal received: closing HTTP server');
      
      server.close(async () => {
        Logger.info('HTTP server closed');
        await Database.getInstance().disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      Logger.info('SIGINT signal received: closing HTTP server');
      
      server.close(async () => {
        Logger.info('HTTP server closed');
        await Database.getInstance().disconnect();
        process.exit(0);
      });
    });
    
    return server;
  } catch (error) {
    Logger.error(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

const server = startServer();

export default server;