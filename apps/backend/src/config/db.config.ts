import mongoose from 'mongoose';
import Logger from './logger.config';

class Database {
  private static instance: Database;
  private readonly connectionString: string;
  private readonly options: mongoose.ConnectOptions;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectInterval: number = 5000; // 5 seconds

  private constructor() {
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/halogen';
    
    // Production-ready connection options
    this.options = {
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      heartbeatFrequencyMS: 10000, // Check connection status every 10 seconds
      retryWrites: true, // Retry failed writes
      retryReads: true, // Retry failed reads
      ssl: process.env.NODE_ENV === 'production', // Use SSL in production
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin', // Authentication database
    };
    
    mongoose.set('strictQuery', true);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      Logger.info('Connecting to MongoDB...');
      await mongoose.connect(this.connectionString, this.options);
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      Logger.info('Connected to MongoDB successfully');
    } catch (error) {
      Logger.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.handleConnectionError(error);
    }

    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    mongoose.connection.on('error', (err) => {
      Logger.error(`MongoDB connection error: ${err.message}`);
      this.handleConnectionError(err);
    });
    
    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected');
      this.handleDisconnection();
    });
    
    mongoose.connection.on('reconnected', () => {
      Logger.info('MongoDB reconnected');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful reconnection
    });
    
    mongoose.connection.on('reconnectFailed', () => {
      Logger.error('MongoDB reconnect failed');
      process.exit(1);
    });
  }
  
  private handleConnectionError(error: unknown): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      
      Logger.info(`Attempting to reconnect to MongoDB in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => this.connect(), delay);
    } else {
      Logger.error(`Failed to connect to MongoDB after ${this.maxReconnectAttempts} attempts`);
      process.exit(1);
    }
  }
  
  private handleDisconnection(): void {
    if (mongoose.connection.readyState === 0) { // 0 = disconnected
      this.handleConnectionError(new Error('MongoDB disconnected'));
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      Logger.info('Disconnected from MongoDB');
    } catch (error) {
      Logger.error(`Error disconnecting from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Get connection status for health checks
  public getStatus(): { status: string; details: Record<string, unknown> } {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const readyState = mongoose.connection.readyState;
    
    return {
      status: states[readyState] || 'unknown',
      details: {
        readyState,
        host: mongoose.connection.host || 'not_connected',
        name: mongoose.connection.name || 'not_connected',
        models: Object.keys(mongoose.models).length,
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0,
      },
    };
  }
}

export default Database;