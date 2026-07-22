export declare class RobotsChecker {
    private static cache;
    private static DEFAULT_USER_AGENT;
    static isAllowed(url: string, userAgent?: string): Promise<boolean>;
}
