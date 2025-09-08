import { UserProfile } from '../types';
import { API_KEY, GOOGLE_CLIENT_ID } from '../env';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile';

let onAuthChangeCallback: (profile: UserProfile | null) => void;
let gapiInitialized = false;
let gisInitialized = false;

// This function is called when both libraries are loaded.
// It attempts a silent sign-in.
function attemptSilentSignIn() {
  if (gapiInitialized && gisInitialized && window.tokenClient) {
    window.tokenClient.requestAccessToken({ prompt: 'none' });
  }
}

async function initializeGapiClient() {
  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInitialized = true;
  attemptSilentSignIn();
}

function gapiLoaded() {
  window.gapi.load('client', initializeGapiClient);
}

function gisLoaded() {
  window.tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: async (resp: any) => {
      // A response with an error field means silent sign-in failed.
      // This is expected if the user isn't logged in.
      // We'll treat it as "signed out" and unblock the UI.
      if (resp.error) {
        console.log("Silent auth failed or user is signed out.");
        onAuthChangeCallback(null);
        return;
      }
      // If we get here, we have a token and can fetch the user's profile.
      await fetchUserProfile();
    },
  });
  gisInitialized = true;
  attemptSilentSignIn();
}

async function fetchUserProfile() {
  try {
    const response = await window.gapi.client.request({
      path: 'https://www.googleapis.com/oauth2/v3/userinfo',
      method: 'GET'
    });
    const profile: UserProfile = {
        name: response.result.name,
        email: response.result.email,
        picture: response.result.picture,
    };
    onAuthChangeCallback(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    onAuthChangeCallback(null);
  }
}

export const initGoogleAuth = (callback: (profile: UserProfile | null) => void) => {
    onAuthChangeCallback = callback;
    
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true;
    scriptGapi.defer = true;
    scriptGapi.onload = gapiLoaded;
    document.body.appendChild(scriptGapi);

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true;
    scriptGis.defer = true;
    scriptGis.onload = gisLoaded;
    document.body.appendChild(scriptGis);
};

export const signIn = () => {
    if (!window.tokenClient) {
        console.error("Google Identity Services client not initialized.");
        return;
    }

    if (window.gapi.client.getToken() === null) {
      // First time sign-in, needs user consent.
      window.tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // User is already signed in, might be a token refresh.
      window.tokenClient.requestAccessToken({prompt: ''});
    }
};

export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      window.gapi.client.setToken('');
      onAuthChangeCallback(null);
    });
  }
};