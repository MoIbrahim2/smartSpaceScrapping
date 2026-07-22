import { IScraperAdapter, ScraperEngineOptions } from '../types/adapter.js';
import { UnifiedProduct } from '../types/schema.js';
export declare class ScraperEngine {
    private adapters;
    private httpClient;
    private checkpoint;
    constructor(options?: {
        delayMs?: number;
        checkpointFile?: string;
    });
    registerAdapter(adapter: IScraperAdapter): void;
    getAvailableAdapters(): string[];
    run(options?: ScraperEngineOptions): Promise<UnifiedProduct[]>;
}
