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
    this.isTelegram = !!( window.Telegram && window.Telegram.WebApp );
    this.webapp = this.isTelegram ? window.Telegram.WebApp : null;

    if ( this.isTelegram )
    {
      this.webapp.ready();

      this.webapp.expand();
      this.webapp.setHeaderColor( "bg_color" );
      this.webapp.setBackgroundColor( "#000000" );
      this.webapp.disableVerticalSwipes();
    }
  }
  onStart(cb: () => void) {
    if (this.isTelegram) {
      this.webapp.MainButton.setText("🚀 Старт");
      this.webapp.MainButton.show();
      this.webapp.MainButton.onClick(cb);
    } else {
      cb();
    }
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
