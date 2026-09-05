import { useEffect, useRef } from 'react';

type BackHandlerFn = () => boolean | void;

interface BackHandlerRegistration {
  id: string;
  priority: number;
  handler: BackHandlerFn;
  createdAt: number;
}

class BackButtonManager {
  private handlers: BackHandlerRegistration[] = [];
  private lastBackPressTime = 0;
  private exitToastCallback: (() => void) | null = null;
  private nextId = 0;

  constructor() {
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    if (typeof window === 'undefined') return;

    // 1. Android WebView interface bridge (called by MainActivity)
    (window as any).__anikuroHandleBack = () => {
      return this.handleBack();
    };

    // 2. Standard Cordova / Capacitor backbutton document event
    document.addEventListener('backbutton', (e: Event) => {
      e.preventDefault();
      this.handleBack();
    });

    // 3. Capacitor App plugin listener if available
    if ((window as any).Capacitor?.Plugins?.App) {
      try {
        (window as any).Capacitor.Plugins.App.addListener('backButton', () => {
          this.handleBack();
        });
      } catch (err) {
        console.warn('Capacitor backButton listener init failed', err);
      }
    }

    // 4. Keyboard Escape key support for browser & desktop testing
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.handleBack();
      }
    });
  }

  register(handler: BackHandlerFn, priority = 10): string {
    const id = `back_handler_${++this.nextId}`;
    this.handlers.push({
      id,
      priority,
      handler,
      createdAt: Date.now(),
    });
    return id;
  }

  unregister(id: string) {
    this.handlers = this.handlers.filter((h) => h.id !== id);
  }

  setExitToastCallback(cb: () => void) {
    this.exitToastCallback = cb;
  }

  handleBack(): boolean {
    if (this.handlers.length > 0) {
      // Sort descending: highest priority first. If priority is equal, newest handler first.
      const sorted = [...this.handlers].sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.createdAt - a.createdAt;
      });

      // Execute topmost handler
      const top = sorted[0];
      try {
        const handled = top.handler();
        this.lastBackPressTime = 0; // reset double-tap timer since popup was closed
        if (handled !== false) {
          return true;
        }
      } catch (err) {
        console.error('Error in back handler:', err);
      }
    }

    // No modal or popup is open! Double-tap to exit on tab
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      this.lastBackPressTime = 0;
      this.exitApp();
      return true;
    } else {
      this.lastBackPressTime = now;
      if (this.exitToastCallback) {
        this.exitToastCallback();
      }
      return false;
    }
  }

  exitApp() {
    // 1. Native Android bridge (injected in MainActivity.java)
    const bridge = (window as any).AndroidNotificationBridge || (window as any).AndroidBridge;
    if (bridge && typeof bridge.exitApp === 'function') {
      bridge.exitApp();
      return;
    }

    // 2. Capacitor App plugin
    const capApp = (window as any).Capacitor?.Plugins?.App;
    if (capApp && typeof capApp.exitApp === 'function') {
      capApp.exitApp();
      return;
    }

    // 3. Cordova navigator.app
    if ((navigator as any).app && typeof (navigator as any).app.exitApp === 'function') {
      (navigator as any).app.exitApp();
      return;
    }
  }
}

export const backButtonManager = new BackButtonManager();

/**
 * React hook to register a back button handler when a modal/popup is open
 */
export function useBackHandler(isActive: boolean, onBack: () => void, priority = 10) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!isActive) return;

    const id = backButtonManager.register(() => {
      onBackRef.current();
      return true;
    }, priority);

    return () => {
      backButtonManager.unregister(id);
    };
  }, [isActive, priority]);
}
