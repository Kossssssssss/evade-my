import { ScreenManager } from "../../screen_manager.js";
import { locations } from "../../configs/location_config.js";
import { TextButton } from "../components/text_button.js";

export class MenuScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screen_manager: ScreenManager;
  private use_joystick: boolean = false;
  private use_images: boolean = false;
  private buttons: TextButton[] = [];

  constructor( canvas: HTMLCanvasElement, screen_manager: ScreenManager )
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext( "2d" )!;
    this.screen_manager = screen_manager;
  }

  public init(): void
  {
    this.createButtons();
    this.draw();

    this.canvas.onclick = ( ev: MouseEvent ) =>
    {
      const x = ev.offsetX;
      const y = ev.offsetY;

      this.buttons.forEach( ( btn ) => btn.handleClick( x, y ) );
    };
  }

  private createButtons(): void
  {
    const centerX = this.canvas.width / 2;

    this.buttons = [];

    locations.forEach( ( loc, i ) =>
    {
      this.buttons.push(
        new TextButton(
          this.ctx,
          loc.name,
          centerX,
          200 + i * 60,
          "24px Arial",
          "white",
          () => this.screen_manager.startGame( i, this.use_joystick, this.use_images )
        )
      );
    } );

    this.buttons.push(
      new TextButton(
        this.ctx,
        `Use Joystick: ${this.use_joystick ? "Yes" : "No"}`,
        centerX,
        300 + locations.length * 60,
        "24px Arial",
        "white",
        () =>
        {
          this.use_joystick = !this.use_joystick;
          this.draw();
        }
      )
    );

    this.buttons.push(
      new TextButton(
        this.ctx,
        `Use Images: ${this.use_images ? "Yes" : "No"}`,
        centerX,
        350 + locations.length * 60,
        "24px Arial",
        "white",
        () =>
        {
          this.use_images = !this.use_images;
          this.draw();
        }
      )
    );
  }

  private draw(): void
  {
    this.ctx.fillStyle = "#222";
    this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText( "SELECT MODE", this.canvas.width / 2, 100 );

    this.createButtons();
    this.buttons.forEach( ( btn ) => btn.draw() );
  }
}
