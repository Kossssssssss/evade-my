import { Vector2 } from './types/main.js';

export class Joystick
{
  private canvas: HTMLCanvasElement;

  private base: Vector2 | null = null;
  private pos: Vector2 | null = null;
  private radius: number = 50;

  constructor( canvas: HTMLCanvasElement )
  {
    this.canvas = canvas;

    canvas.addEventListener( 'pointerdown', this.onPointerDown, { passive: false } );
    canvas.addEventListener( 'pointermove', this.onPointerMove, { passive: false } );
    canvas.addEventListener( 'pointerup', this.onPointerUp, { passive: false } );
    canvas.addEventListener( 'pointercancel', this.onPointerUp, { passive: false } );
    canvas.addEventListener( 'pointerleave', this.onPointerUp, { passive: false } );
  }

  private toCanvasCoords( ev: PointerEvent ): Vector2
  {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: ( ev.clientX - rect.left ) * scaleX,
      y: ( ev.clientY - rect.top ) * scaleY
    };
  }

  private onPointerDown = ( ev: PointerEvent ) =>
  {
    ev.preventDefault();
    const p = this.toCanvasCoords( ev );
    this.base = { ...p };
    this.pos = { ...p };
  };

  private onPointerMove = ( ev: PointerEvent ) =>
  {
    if ( !this.base ) return;
    ev.preventDefault();
    const p = this.toCanvasCoords( ev );

    const dx = p.x - this.base.x;
    const dy = p.y - this.base.y;
    const dist = Math.hypot( dx, dy );
    const clampedDist = Math.min( dist, this.radius );

    const normX = ( dx / dist ) * clampedDist;
    const normY = ( dy / dist ) * clampedDist;

    this.pos = {
      x: this.base.x + normX,
      y: this.base.y + normY
    };
  };

  private onPointerUp = ( _ev: PointerEvent ) =>
  {
    this.base = null;
    this.pos = null;
  };

  public getDirection(): Vector2
  {
    if ( !this.base || !this.pos ) return { x: 0, y: 0 };

    const dx = this.pos.x - this.base.x;
    const dy = this.pos.y - this.base.y;
    const dist = Math.hypot( dx, dy );
    if ( dist === 0 ) return { x: 0, y: 0 };

    const intensity = Math.min( dist / this.radius, 1 );

    return {
      x: ( dx / dist ) * intensity,
      y: ( dy / dist ) * intensity
    };
  }

  public draw( ctx: CanvasRenderingContext2D ): void
  {
    if ( !this.base ) return;

    ctx.beginPath();
    ctx.arc( this.base.x, this.base.y, this.radius, 0, Math.PI * 2 );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if ( this.pos )
    {
      ctx.beginPath();
      ctx.arc( this.pos.x, this.pos.y, this.radius / 2, 0, Math.PI * 2 );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }
  }
}
