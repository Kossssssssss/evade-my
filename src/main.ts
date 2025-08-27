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

window.addEventListener( "resize", () =>
{
  const hudCanvas = document.getElementById( "hudCanvas" ) as HTMLCanvasElement;
  if ( hudCanvas )
  {
    const ctx = hudCanvas.getContext( "2d" );
    if ( ctx ) resizeCanvas( hudCanvas, ctx );
  }
} );

function resizeCanvas( canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D )
{
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  ctx.setTransform( dpr, 0, 0, dpr, 0, 0 );
}