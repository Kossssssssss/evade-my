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

      const centerX = this.canvas.width / 2;
      const half_width = 150;
      const height = 30;

      for ( let i = 0; i < locations.length; i++ )
      {
        const textY = 200 + i * 60;
        if ( x >= centerX - half_width && x <= centerX + half_width &&
          y >= textY - height && y <= textY + height )
        {
          this.screen_manager.startGame( i, this.use_joystick, this.use_images );
          return;
        }
      }

      const joy_y = 300 + locations.length * 60;
      const image_y = 350 + locations.length * 60;

      if ( x >= centerX - half_width && x <= centerX + half_width &&
        y >= joy_y - height && y <= joy_y + height )
      {
        this.use_joystick = !this.use_joystick;
        this.draw();
        return;
      }

      if ( x >= centerX - half_width && x <= centerX + half_width &&
        y >= image_y - height && y <= image_y + height )
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
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    this.ctx.fillText( 'SELECT MODE', this.canvas.width / 2, 100 );

    for ( let i = 0; i < locations.length; i++ )
    {
      const loc = locations[i];
      this.ctx.fillText( loc.name, this.canvas.width / 2, 200 + i * 60 );
    }

    const joy_y = 300 + locations.length * 60;
    const image_y = 350 + locations.length * 60;

    this.ctx.font = '24px Arial';
    this.ctx.fillText( `Use Joystick: ${this.use_joystick ? 'Yes' : 'No'}`, this.canvas.width / 2, joy_y );
    this.ctx.fillText( `Use images: ${this.use_images ? 'Yes' : 'No'}`, this.canvas.width / 2, image_y );
  }

}