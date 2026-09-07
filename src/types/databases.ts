export type DatabaseEngine =
  | "COSMOS_DB"
  | "QUEST_DB"
  | "REDIS_INMEMORY"
  | "POSTGRES_SQL"
  | "DUCKDB_PARQUET"
  | "MONGODB_ATLAS";

export type DatabaseStatusType = "CONNECTED" | "DEGRADED" | "DISCONNECTED" | "STANDBY" | "SIMULATED_LOCAL";

export interface DatabaseHealthInfo {
  id: DatabaseEngine;
  name: string;
  category: "NoSQL Document" | "Time-Series TSDB" | "In-Memory Microsecond Cache" | "Relational ACID Ledger" | "Columnar Cold Lakehouse" | "Document Store";
  status: DatabaseStatusType;
  endpoint: string;
  pingLatencyMs: number;
  totalRecordsStored: number;
  throughput: string;
  storageUsageMb: number;
  lastSyncAt: string;
  activeFeatures: string[];
  description: string;
}

export interface CosmosDbOptions {
  endpoint: string;
  databaseId: string;
  collectionTbt: string;
  collectionTrades: string;
  collectionAuditLogs: string;
  throughputMode: "PROVISIONED_RU" | "SERVERLESS";
  provisionedRu: number;
  partitionKeyStrategy: "SYMBOL_DATE" | "SYMBOL_HOUR" | "CONTRACT_EXPIRY";
  consistencyLevel: "SESSION" | "STRONG" | "BOUNDED_STALENESS" | "EVENTUAL";
  bufferFlushIntervalMs: number;
  maxBatchSize: number;
  isRecordingActive: boolean;
  compressionRatio: string;
}

export interface QuestDbOptions {
  host: string;
  ilpPort: number; // Influx Line Protocol (9009)
  pgWirePort: number; // 8812
  httpPort: number; // 9000
  partitionBy: "DAY" | "HOUR" | "WEEK" | "MONTH";
  designatedTimestampColumn: string;
  walEnabled: boolean;
  maxUncommittedRows: number;
  commitLagUs: number;
  tableTicks: string;
  tableOhlcv: string;
  tableDepthL3: string;
  isIngestingActive: boolean;
}

export interface RedisCacheOptions {
  connectionUri: string;
  dbIndex: number;
  maxMemoryMb: number;
  evictionPolicy: "volatile-lru" | "allkeys-lru" | "noeviction" | "volatile-ttl";
  persistenceMode: "AOF_EVERYSEC" | "RDB_SNAPSHOTS" | "MEMORY_ONLY_EPHEMERAL";
  pubSubChannels: string[];
  distributedLockTtlMs: number;
  isL3CacheActive: boolean;
}

export interface PostgresOptions {
  connectionUri: string;
  sslMode: "require" | "verify-full" | "prefer" | "disable";
  maxPoolSize: number;
  minPoolSize: number;
  synchronousCommit: "on" | "off" | "local";
  tableTrades: string;
  tableAuditLedger: string;
  tableAccounts: string;
  autoMigrateSchema: boolean;
  isLedgerActive: boolean;
}

export interface DuckDbParquetOptions {
  storageTarget: "LOCAL_NVME" | "AWS_S3" | "AZURE_BLOB" | "GCS_BUCKET";
  bucketOrDirectory: string;
  compressionCodec: "ZSTD" | "SNAPPY" | "LZ4" | "GZIP";
  zstdLevel: number;
  rowGroupSizeMb: number;
  autoCompactIntervalMin: number;
  isColdArchivalActive: boolean;
}

export interface MongoDbOptions {
  connectionUri: string;
  databaseName: string;
  collectionPresets: string;
  collectionAlerts: string;
  readPreference: "primaryPreferred" | "nearest" | "secondary";
  isDocumentSyncActive: boolean;
}

export interface DataIngestionRouting {
  tbtL3Depth: DatabaseEngine[];
  executedTrades: DatabaseEngine[];
  strategySignals: DatabaseEngine[];
  greeksSurfaces: DatabaseEngine[];
  historicalColdArchival: DatabaseEngine[];
}

export interface EnterpriseDatabasesState {
  cosmos: CosmosDbOptions;
  questdb: QuestDbOptions;
  redis: RedisCacheOptions;
  postgres: PostgresOptions;
  duckdb: DuckDbParquetOptions;
  mongodb: MongoDbOptions;
  routing: DataIngestionRouting;
  engines: DatabaseHealthInfo[];
}
