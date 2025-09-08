import { DebateRecord } from "../types";

declare global {
  interface Window {
    gapi: any;
  }
}

const HISTORY_FILE_NAME = "agora-ai-history.json";
let fileId: string | null = null;

/**
 * Finds or creates the history file in the appDataFolder.
 * Caches the file ID for subsequent requests.
 */
const getOrCreateFileId = async (): Promise<string> => {
    if (fileId) {
        return fileId;
    }

    try {
        // List files in the appDataFolder
        const response = await window.gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
        });

        const existingFile = response.result.files.find(
            (file: any) => file.name === HISTORY_FILE_NAME
        );

        if (existingFile) {
            fileId = existingFile.id;
            return fileId!;
        }

        // If not found, create it
        const createResponse = await window.gapi.client.drive.files.create({
            resource: {
                name: HISTORY_FILE_NAME,
                parents: ['appDataFolder'],
            },
            fields: 'id',
        });
        
        fileId = createResponse.result.id;
        return fileId!;

    } catch (error) {
        console.error("Error getting or creating file ID:", error);
        throw new Error("Could not access Google Drive file.");
    }
};

/**
 * Loads the debate history from the file in Google Drive.
 */
export const loadHistory = async (): Promise<DebateRecord[]> => {
    try {
        const id = await getOrCreateFileId();
        const response = await window.gapi.client.drive.files.get({
            fileId: id,
            alt: 'media',
        });
        
        // If the file is empty, response.body will be empty string
        if (!response.body) {
            return [];
        }
        
        return JSON.parse(response.body);

    } catch (error: any) {
        // A 404 might mean the file is new and empty, which is not an error
        if (error.status === 404) {
            return [];
        }
        console.error("Error loading history from Drive:", error);
        return []; // Return empty array on error to prevent app crash
    }
};

/**
 * Saves the debate history to the file in Google Drive.
 */
export const saveHistory = async (history: DebateRecord[]): Promise<void> => {
    try {
        const id = await getOrCreateFileId();
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
            'mimeType': 'application/json',
        };
        
        const content = JSON.stringify(history, null, 2);

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            content +
            close_delim;

        await window.gapi.client.request({
            path: `/upload/drive/v3/files/${id}`,
            method: 'PATCH',
            params: { uploadType: 'multipart' },
            headers: {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"',
            },
            body: multipartRequestBody,
        });

    } catch (error) {
        console.error("Error saving history to Drive:", error);
        throw new Error("Could not save history to Google Drive.");
    }
};
