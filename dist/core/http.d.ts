import { AxiosRequestConfig } from 'axios';
export declare class HttpClient {
    private axiosInstance;
    private delayMs;
    constructor(delayMs?: number);
    private getRandomUserAgent;
    private sleep;
    fetch(url: string, options?: AxiosRequestConfig, retries?: number): Promise<string | null>;
}
