declare module "types" {
    export function parseEFFile(content: string): any[];
    export function evaluateCases(cases: any[]): any[];
    export function formatResults(cases: any[]): string;
    export function mergeCases(existingCases: any[], newCases: any[]): any[];
}