declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

export interface WebApp {
  initData: string;
  initDataUnsafe: any;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;

  // Методи
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;

  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
  };

  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
}
