export interface PlatformAPI {
  isTelegram: boolean;
  onStart(cb: () => void): void;
  onBack(cb: () => void): void;
  getUser(): any;
}

export class Platform implements PlatformAPI {
  isTelegram: boolean;
  private webapp: any;

  constructor()
  {
    this.isTelegram = typeof window !== "undefined" && !!( window as any ).Telegram?.WebApp;
    this.webapp = this.isTelegram ? ( window as any ).Telegram.WebApp : null;

    if ( this.isTelegram )
    {
      console.log('webapp ready');
      this.webapp.ready();

      this.webapp.expand();
      this.webapp.setHeaderColor( "bg_color" );
      this.webapp.setBackgroundColor( "#000000" );
      this.webapp.disableVerticalSwipes();

      if ( this.webapp.setSettings )
      {
        console.log('disable vertical swipes');
        this.webapp.setSettings( { allow_vertical_swipe: false } );
      }
    }
  }
  onStart(cb: () => void) {
    cb();
  }

  onBack(cb: () => void) {
    if (this.isTelegram) {
      this.webapp.BackButton.show();
      this.webapp.BackButton.onClick(cb);
    } else {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cb();
      });
    }
  }

  getUser() {
    return this.isTelegram ? this.webapp.initDataUnsafe.user : null;
  }
}
