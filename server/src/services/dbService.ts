import mongoose from 'mongoose';
import { ENV } from '../config/env.js';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  try {
    const opts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    };

    await mongoose.connect(ENV.MONGODB_URI, opts);
    isConnected = true;
    const sanitizedUri = ENV.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
    console.log(`[MongoDB] Connected successfully to ${sanitizedUri}`);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB (${message}). Running with in-memory persistence.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
