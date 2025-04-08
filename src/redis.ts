import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const THIRTY_MINUTES = 30 * 60 * 1000;

class Redis {
    private redisClient;
    constructor(url: string) {
        this.redisClient = createClient({
            url: url,
            socket: {
                tls: true,
                rejectUnauthorized: false,
            }
        })
            .on('error', err => console.log('Redis Client Error', err))
            .connect();
    }

    async set(key: string, value: string, expireInSeconds: number = THIRTY_MINUTES) {
        try {
            await (await this.redisClient).set(key, value, {
                EX: expireInSeconds,
            });
        } catch (error) {
            console.error('Error setting value in Redis:', error);
            throw error;
        }
    }
    async get(key: string) {
        try {
            return await (await this.redisClient).get(key);
        } catch (error) {
            console.error('Error getting value from Redis:', error);
            throw error;
        }
    }
    async del(key: string) {
        await (await this.redisClient).del(key);
    }
}

export const redis = new Redis(REDIS_URL)