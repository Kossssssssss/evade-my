import { ScreenManager } from './screen_manager.js';
import { Platform } from './platform.js';
import { AssetManager } from './assets_manager.js';

window.addEventListener('DOMContentLoaded', () => {
  const screen_manager = new ScreenManager();
  const platform = new Platform();

  AssetManager.loadAll();

  ["menuCanvas", "gameCanvas", "resultsCanvas", "hudCanvas"].forEach(id => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });

  platform.onStart(() => {
    screen_manager.start();
  });
});