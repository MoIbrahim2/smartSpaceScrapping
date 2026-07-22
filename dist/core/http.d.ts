import { AxiosRequestConfig } from 'axios';
export declare class HttpClient {
    private axiosInstance;
    private delayMs;
    private maxRetries;
    constructor(delayMs?: number, maxRetries?: number, timeoutMs?: number);
    private getRandomUserAgent;
    private sleep;
    fetch(url: string, options?: AxiosRequestConfig, retries?: number): Promise<string | null>;
}
