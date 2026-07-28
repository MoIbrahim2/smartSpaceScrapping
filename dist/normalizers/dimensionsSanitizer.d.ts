export interface SanitizedDimensions {
    width: number;
    height: number;
    length: number;
    weight: number;
    unit: 'cm';
    issues: string[];
}
/**
 * Sanitizes extracted 3D spatial dimensions (width, height, length in cm).
 * Automatically imputes realistic category defaults for any null fields.
 */
export declare function sanitizeDimensions(rawDims: {
    width: number | null;
    height: number | null;
    depth?: number | null;
    length?: number | null;
    weight: number | null;
}, title: string, description: string, category: string): SanitizedDimensions;
