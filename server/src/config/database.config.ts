export const databaseConfig = {
    postgresUrl: process.env.DATABASE_URL ?? '',
    mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/support_bds_raw',
};
