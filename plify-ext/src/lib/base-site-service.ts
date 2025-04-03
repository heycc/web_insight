import { SummaryService } from './summary';
import { ContentService, ContentData, ContentComment } from './content-service';
import { createLogger } from './utils';
// import type { Logger } from 'browser-extension-logger'; // Assuming createLogger returns this type - Removed incorrect import

// Define a more specific type for the data expected by SummaryService if possible
// For now, using 'any', but ideally this would be a defined interface.
type SummaryInputData = any;

/**
 * Abstract base class for site-specific content services.
 * Provides common functionality for interacting with tabs, content scripts,
 * and the summarization service.
 */
export abstract class BaseSiteService implements ContentService {
    protected summaryService: SummaryService;
    protected logger: any; // Use a generic type like 'any' or 'Console' for now

    constructor(summaryService?: SummaryService) {
        this.summaryService = summaryService || new SummaryService();
        // Logger is created in the subclass constructor using getSiteName()
        // Assigning it here temporarily to satisfy TypeScript's strict initialization checks
        // It will be overwritten immediately in the subclass constructor.
        this.logger = createLogger('BaseServiceInit');
    }

    // --- Methods required by ContentService interface ---

    public async extractData(): Promise<ContentData> {
        this.logger.log(`Starting extractData`);
        const activeTab = await this.getActiveTab();
        const tabId = activeTab.id!; // Presence checked in getActiveTab

        // Validate URL structure (domain and specific page check)
        if (!this.isValidUrl(activeTab.url)) {
            const errorMsg = `Current page is not a valid ${this.getSiteName()} page for extraction. URL: ${activeTab.url}`;
            this.logger.error(errorMsg);
            // Provide a more user-friendly error potentially derived from isValidPage implementation
            throw new Error(this.getInvalidPageError(activeTab.url));
        }

        // Ensure the content script is loaded and responsive
        await this.ensureContentScriptReady(tabId);

        const action = `extract.${this.getSiteName().toLowerCase()}`;

        try {
            // Send message to content script and wait for response with timeout
            const results = await this.sendMessageWithTimeout(tabId, { action }, 5000);

            if (results && results.success) {
                // Convert the site-specific raw data into the standardized ContentData format
                const contentData = this.convertRawDataToContentData(results.data, activeTab.url!);
                return contentData;
            } else {
                // Handle errors reported by the content script
                const errorMessage = results?.error || `Content script failed to extract data for action: ${action}`;
                this.logger.error(`Extraction failed: ${errorMessage}`, results);
                throw new Error(errorMessage);
            }
        } catch (error) {
            // Handle timeouts or other communication errors
            const errorMessage = `Error during extraction process: ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMessage);
            // Rethrow or wrap the error as appropriate
            throw error instanceof Error ? error : new Error(errorMessage);
        }
    }

    public async* summarizeData(data: ContentData, customPrompt?: string): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown> {
        // Convert the standard ContentData into the format expected by the SummaryService
        const summaryInput = this.convertToSummaryFormat(data);
        yield* this.summaryService.streamSummary(summaryInput, customPrompt);
    }

    public stopSummarization(): void {
        this.logger.log('Stopping summarization stream.');
        this.summaryService.abortStream();
    }

    public getSummaryService(): SummaryService {
        return this.summaryService;
    }

    /**
     * Sends a message to the content script to highlight comments by a specific username.
     * @param username The username to highlight comments for
     */
    public async highlightUserComments(username: string): Promise<void> {
        const activeTab = await this.getActiveTab();
        const tabId = activeTab.id!; // Presence checked in getActiveTab

        // Ensure the content script is loaded and responsive
        await this.ensureContentScriptReady(tabId);

        const action = `highlight.${this.getSiteName().toLowerCase()}`;

        try {
            // Send message to content script with the username
            const results = await this.sendMessageWithTimeout(tabId, { 
                action,
                username
            }, 3000);

            if (!results || !results.success) {
                // Handle errors reported by the content script
                const errorMessage = results?.error || `Content script failed to highlight comments for action: ${action}`;
                this.logger.error(`Highlighting failed: ${errorMessage}`, results);
                throw new Error(errorMessage);
            }
        } catch (error) {
            // Handle timeouts or other communication errors
            const errorMessage = `Error during highlighting process: ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMessage);
            // Rethrow or wrap the error as appropriate
            throw error instanceof Error ? error : new Error(errorMessage);
        }
    }

    // --- Helper methods for internal use ---

    /**
     * Retrieves the active tab and ensures it has an ID.
     */
    protected async getActiveTab(): Promise<chrome.tabs.Tab> {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            this.logger.error('No active tab found');
            throw new Error('No active tab found');
        }
        const activeTab = tabs[0];
        if (!activeTab.id) {
            this.logger.error('Active tab has no ID');
            throw new Error('Active tab ID is undefined');
        }
        if (!activeTab.url) {
            this.logger.warn('Active tab has no URL');
            // Depending on usage, might throw an error or allow proceeding
        }
        this.logger.log(`Active tab found: ID=${activeTab.id}, URL=${activeTab.url}`);
        return activeTab;
    }

    /**
     * Checks if the URL matches the site domain and specific page criteria.
     */
    protected isValidUrl(url: string | undefined): boolean {
        if (!url) return false;
        return url.includes(this.getSiteDomain()) && this.isValidPage(url);
    }

    /**
     * Pings the content script and attempts to reload it if the ping fails.
     */
    protected async ensureContentScriptReady(tabId: number): Promise<void> {
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        } catch (error) {
            this.logger.warn(`Ping failed for tab ${tabId}. Attempting to reload content scripts. Error: ${error instanceof Error ? error.message : String(error)}`);
            try {
                const scriptsToInject: string[] = ['content.js'];
                const siteScript = this.getSiteContentScriptFilename();
                if (siteScript) {
                    scriptsToInject.push(siteScript);
                } else {
                    this.logger.warn(`No site-specific content script filename provided by ${this.getSiteName()} service.`);
                    // Decide if this is an error or just a warning
                }

                if (scriptsToInject.length > 0) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: scriptsToInject,
                    });
                    this.logger.log(`Injected scripts [${scriptsToInject.join(', ')}] into tab ${tabId}. Pinging again...`);
                    // Try ping again after reload
                    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
                } else {
                    throw new Error("Content script ping failed and no scripts available to inject.");
                }
            } catch (reloadError) {
                const errorMsg = `Failed to reload content script or second ping failed in tab ${tabId}. Error: ${reloadError instanceof Error ? reloadError.message : String(reloadError)}`;
                this.logger.error(errorMsg);
                // Provide a user-friendly error message
                throw new Error(`Could not communicate with the page extension on ${this.getSiteName()}. Please try refreshing the page.`);
            }
        }
    }

    /**
     * Sends a message to a tab's content script with a specified timeout.
     */
    protected async sendMessageWithTimeout(tabId: number, message: any, timeoutMs: number): Promise<any> {
        const actionDescription = typeof message?.action === 'string' ? message.action : 'message';

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout (${timeoutMs}ms) waiting for response to ${actionDescription} from tab ${tabId}`));
            }, timeoutMs);

            chrome.tabs.sendMessage(tabId, message)
                .then(response => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error); // Forward the original sendMessage error
                });
        });
    }


    // --- Abstract methods and properties to be implemented by subclasses ---

    /**
     * Returns the display name of the site (e.g., "Reddit", "YouTube").
     */
    abstract getSiteName(): string;

    /**
     * Returns the primary domain name of the site (e.g., "reddit.com", "youtube.com").
     * Used for basic URL matching.
     */
    abstract getSiteDomain(): string;

    /**
     * Returns the filename of the site-specific content script (e.g., "reddit-content.js").
     * This script should be responsible for registering the site's extractor function.
     * Return `null` or an empty string if no site-specific script is needed beyond the main 'content.js'.
     */
    abstract getSiteContentScriptFilename(): string | null;

    /**
     * Performs site-specific validation on the URL to ensure it's a page
     * from which data can be extracted (e.g., a video page, a post page).
     * @param url The URL of the active tab.
     * @returns `true` if the page is valid for extraction, `false` otherwise.
     */
    abstract isValidPage(url: string): boolean;

    /**
     * Provides a user-friendly error message when `isValidPage` returns false.
     * @param url The URL that failed validation.
     */
    abstract getInvalidPageError(url: string | undefined): string;


    /**
     * Converts the raw data object received from the content script extractor
     * into the standardized `ContentData` format.
     * @param rawData The data object directly from `window.__PLIFY_EXTRACTORS[site]()`.
     * @param url The URL from which the data was extracted.
     * @returns A `ContentData` object.
     */
    abstract convertRawDataToContentData(rawData: any, url: string): ContentData;

    /**
     * Converts the standard `ContentData` object into the specific format
     * required by the `SummaryService.streamSummary` method.
     * @param data The `ContentData` object.
     * @returns The data formatted for the summarization service.
     */
    abstract convertToSummaryFormat(data: ContentData): SummaryInputData;

} 