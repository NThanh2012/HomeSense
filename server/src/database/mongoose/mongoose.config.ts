export const getMongoUri = (): string => {
    return process.env.MONGODB_URI ?? 'mongodb://localhost:27017/support_bds_raw';
};
