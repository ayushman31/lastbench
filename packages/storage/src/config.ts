export interface StorageConfig {
    provider: "s3" | "r2" | "garage";
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    publicUrl?: string;
    forcePathStyle?: boolean;
}

export function getStorageConfig(): StorageConfig {
    const provider = (process.env.STORAGE_PROVIDER || "garage") as StorageConfig["provider"];

    const baseConfig = {
        provider,
        bucket: process.env.STORAGE_BUCKET!,
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    };

    switch (provider) {
        case "garage":
            return {
                ...baseConfig,
                region: "garage",
                endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:3900',
                publicUrl: process.env.STORAGE_PUBLIC_URL || 'http://localhost:3900',
                forcePathStyle: true, // required for garage
            };

        case "s3":
            return {
                ...baseConfig,
                region: process.env.AWS_REGION!,
                endpoint: process.env.AWS_ENDPOINT!,
                publicUrl: process.env.STORAGE_PUBLIC_URL!,
                forcePathStyle: false,
            };

        case "r2":
            const accountId = process.env.R2_ACCOUNT_ID!;
            return {
                ...baseConfig,
                region: 'auto',
                endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
                publicUrl: process.env.STORAGE_PUBLIC_URL!,
                forcePathStyle: false,
            };
        
        default:
            throw new Error(`Unsupported storage provider: ${provider}`);
    };
}