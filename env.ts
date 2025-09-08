// IMPORTANT: Replace with your actual credentials.
// For development, you can hardcode these.
// For production, use a proper environment variable system.

export const API_KEY = process.env.API_KEY || "YOUR_GEMINI_API_KEY";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

if (API_KEY === "YOUR_GEMINI_API_KEY") {
  console.warn("Using placeholder Gemini API Key. Please replace with your actual key.");
}

if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    console.warn("Using placeholder Google Client ID. Please replace with your actual key for Google Sign-In to work.");
}
