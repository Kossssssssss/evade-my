export class LoaderScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private angle: number = 0;
  private running: boolean = false;

  constructor( canvas: HTMLCanvasElement )
  {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext( "2d" )!;
  }

  start()
  {
    this.running = true;
    this.loop();
  }

  stop()
  {
    this.running = false;
    this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
  }

  private loop = () =>
  {
    if ( !this.running ) return;
    this.draw();
    requestAnimationFrame( this.loop );
  };

  private draw()
  {
    const { ctx, canvas } = this;
    ctx.clearRect( 0, 0, canvas.width, canvas.height );

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText( "Loading...", canvas.width / 2, canvas.height / 2 - 40 );

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 25;

    ctx.save();
    ctx.translate( cx, cy );
    ctx.rotate( this.angle );

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc( 0, 0, radius, 0, Math.PI * 1.5 );
    ctx.stroke();

    ctx.restore();

    this.angle += 0.05;
  }
}
