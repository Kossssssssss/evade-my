import { Game } from './game.js';

document.addEventListener( 'DOMContentLoaded', () =>
{
  const canvas = document.getElementById( 'gameCanvas' ) as HTMLCanvasElement;
  const game = new Game( canvas );
  game.run();
} );
