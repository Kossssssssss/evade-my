import { ScreenManager } from "../screen_manager.js";
import { locations } from "../configs/location_config.js";

export class MenuScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screen_manager: ScreenManager;
  private use_joystick: boolean = false;
  private use_images: boolean = false;

  public constructor( canvas: HTMLCanvasElement, screen_manager: ScreenManager )
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext( '2d' )!;
    this.screen_manager = screen_manager;
  }

  public init(): void
  {
    this.draw();

    this.canvas.onclick = ( ev: MouseEvent ) =>
    {
      const x = ev.offsetX;
      const y = ev.offsetY;

      for ( let i = 0; i < locations.length; i++ )
      {
        const bx = 250;
        const by = 200 + i * 60;
        if ( x >= bx && x <= bx + 300 && y >= by - 30 && y <= by )
        {
          this.screen_manager.startGame( i, this.use_joystick, this.use_images );
          return;
        }
      }

      const joy_y = 300 + locations.length * 60;
      const image_y = 350 + locations.length * 60;
      if ( x >= 250 && x <= 550 && y >= joy_y - 30 && y <= joy_y )
      {
        this.use_joystick = !this.use_joystick;
        this.draw();
      }

      if ( x >= 250 && x <= 550 && y >= image_y - 30 && y <= image_y )
      {
        this.use_images = !this.use_images;
        this.draw();
        return;
      }
    };
  }

  private draw(): void
  {
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

    this.ctx.fillStyle = 'white';
    this.ctx.font = '30px Arial';
    this.ctx.fillText( 'SELECT MODE', 250, 100 );

    for ( let i = 0; i < locations.length; i++ )
    {
      const loc = locations[i];
      this.ctx.fillText( loc.name, 250, 200 + i * 60 );
    }

    const image_y = 350 + locations.length * 60;

    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Use images: ${this.use_images ? 'Yes' : 'No'}`,
      250,
      image_y
    );

    this.ctx.font = '24px Arial';
    this.ctx.fillText( `Use Joystick: ${this.use_joystick ? 'Yes' : 'No'}`, 250, 300 + locations.length * 60 );
  }
}