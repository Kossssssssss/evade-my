import { MenuScreen } from './screens/menu_screen.js';
import { GameScreen } from './screens/game_screen.js';
import { ResultsScreen } from './screens/results_screen.js';

type ScreenName = 'menu' | 'game' | 'results';

export class ScreenManager
{
  private menu_screen: MenuScreen;
  private game_screen: GameScreen;
  private results_screen: ResultsScreen;
  private current_screen: ScreenName = 'menu';

  public constructor()
  {
    const canvas_menu = document.getElementById( 'menuCanvas' ) as HTMLCanvasElement;
    const canvas_game = document.getElementById( 'gameCanvas' ) as HTMLCanvasElement;
    const canvas_results = document.getElementById( 'resultsCanvas' ) as HTMLCanvasElement;

    this.menu_screen = new MenuScreen( canvas_menu, this );
    this.game_screen = new GameScreen( canvas_game, this );
    this.results_screen = new ResultsScreen( canvas_results, this );
  }

  public start(): void
  {
    this.showScreen( 'menu' );
  }

  public showScreen( screen: ScreenName ): void
  {
    this.hideAllCanvases();

    if ( screen === 'menu' )
    {
      this.menu_screen.init();
    } else if ( screen === 'game' )
    {
      this.game_screen.init();
    } else if ( screen === 'results' )
    {
      const final_score = this.game_screen.getScore();
      this.results_screen.init( final_score );
    }

    const canvas_id = `${screen}Canvas`;
    const canvas = document.getElementById( canvas_id );
    if ( canvas ) canvas.style.display = 'block';

    this.current_screen = screen;
  }

  public startGame( location_index: number, use_joystick: boolean, use_images: boolean ): void
  {
    this.game_screen.setConfig( location_index, use_joystick, use_images );
    this.showScreen( 'game' );
  }

  private hideAllCanvases(): void
  {
    ['menuCanvas', 'gameCanvas', 'resultsCanvas'].forEach( ( id ) =>
    {
      const canvas = document.getElementById( id );
      if ( canvas ) canvas.style.display = 'none';
    } );
  }
}
