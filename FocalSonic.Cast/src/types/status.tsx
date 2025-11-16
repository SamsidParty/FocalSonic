export interface Status {
    isLoading?: boolean;
    isError?: boolean;
    statusCode?: string;
    statusMessage: string;
}