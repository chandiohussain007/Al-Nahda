/** Minimal typings for the Google Identity Services script. */

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
}

interface GoogleButtonConfiguration {
  theme?: string;
  size?: string;
  width?: number;
  text?: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: GoogleIdConfiguration) => void;
    renderButton: (element: HTMLElement, options: GoogleButtonConfiguration) => void;
  };
}

interface GoogleGlobal {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

export {};
