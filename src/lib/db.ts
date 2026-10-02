import mongoose from "mongoose";

function getMongoUri(): string {
  const envUri = process.env.MONGODB_URI?.trim();
  if (envUri && !envUri.includes("localhost:27017")) {
    return envUri;
  }
  return "mongodb+srv://adarshkp1128_db_user:mIFs9ZqUxN7lpegh@caresync.v6p2ckg.mongodb.net/caresync?appName=CareSync";
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Establishes or retrieves the existing MongoDB connection with connection pooling.
 * Validates connection readiness and reconnects if dropped.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = getMongoUri();

  // If already connected and ready to Atlas, return existing connection immediately (0ms delay)
  if (
    cached.conn &&
    mongoose.connection.readyState === 1 &&
    !mongoose.connection.host?.includes("localhost") &&
    !mongoose.connection.host?.includes("127.0.0.1")
  ) {
    return cached.conn;
  }

  if (
    mongoose.connection.readyState === 1 &&
    (mongoose.connection.host?.includes("localhost") || mongoose.connection.host?.includes("127.0.0.1"))
  ) {
    console.log("[connectToDatabase] Disconnecting from localhost to connect to Atlas...");
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  // Re-establish connection if promise is missing or connection state is disconnected
  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: true,
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log("[connectToDatabase] Connected to:", mongooseInstance.connection.host, mongooseInstance.connection.name);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
