import { ScreenManager } from './screen_manager.js';

window.addEventListener( 'DOMContentLoaded', () =>
{
  const screen_manager = new ScreenManager();
  screen_manager.start();
} );