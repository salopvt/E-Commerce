// import Redis from "ioredis"
// import dotenv from "dotenv"

// dotenv.config()

// export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

// await redis.set("foo","bar");

// import Redis from "ioredis";
// import dotenv from "dotenv";

// dotenv.config();

// export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
//   password: process.env.UPSTASH_REDIS_TOKEN, // ⬅️ this is required
//   tls: {}, // ⬅️ required for secure Upstash connection (rediss)
// });
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: 5,
  reconnectOnError: () => true,
});

