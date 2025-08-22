import { WebApp } from "../../telegram";

export class TelegramController {
  tg: WebApp;

  constructor() {
    this.tg = window.Telegram.WebApp;
    this.tg.ready();
    this.tg.expand();
  }

  initMainButton(onStart: () => void) {
    this.tg.MainButton.setText("🚀 Старт");
    this.tg.MainButton.show();
    this.tg.MainButton.onClick(() => {
      onStart();
      this.tg.sendData("start_game");
    });
  }

  initBackButton(onBack: () => void) {
    this.tg.BackButton.show();
    this.tg.BackButton.onClick(() => {
      onBack();
      this.tg.close();
    });
  }

  getUser() {
    return this.tg.initDataUnsafe?.user;
  }
}
