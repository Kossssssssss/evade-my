import { ScreenManager } from './screen_manager.js';
import { Platform } from './platform.js';

window.addEventListener('DOMContentLoaded', () => {
  const screen_manager = new ScreenManager();
  const platform = new Platform();

  ["menuCanvas", "gameCanvas", "resultsCanvas"].forEach(id => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });

  platform.onStart(() => {
    screen_manager.start();
  });

  console.log("User:", platform.getUser());
});
