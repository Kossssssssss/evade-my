import { ScreenManager } from "../screen_manager.js";

export class ResultsScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screen_manager: ScreenManager;
  private final_score: number = 0;

  public constructor( canvas: HTMLCanvasElement, screen_manager: ScreenManager )
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext( '2d' )!;
    this.screen_manager = screen_manager;
  }

  public init( score: number ): void
  {
    this.final_score = score;
    this.draw();
    this.canvas.onclick = () =>
    {
      this.screen_manager.showScreen( 'menu' );
    };
  }

  private draw(): void
  {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

    this.ctx.fillStyle = 'white';
    this.ctx.font = '28px Arial';
    this.ctx.textAlign = "center"; 
    this.ctx.textBaseline = "middle";

    const center_x = this.canvas.width / 2;

    const score_y = this.canvas.height / 2 - 40;
    const back_y = this.canvas.height / 2 + 20;

    this.ctx.fillText( `FINAL SCORE: ${this.final_score}`, center_x, score_y );
    this.ctx.fillText( "CLICK TO RETURN TO MENU", center_x, back_y );
  }
}