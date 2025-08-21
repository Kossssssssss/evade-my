import { Vector2, GameObject } from './interfaces.js';

export class Player implements GameObject
{
  position: Vector2 = { x: 0, y: 0 };
  velocity: Vector2 = { x: 0, y: 0 };
  radius: number = 20;
  image?: HTMLImageElement;
  invincible: boolean = false;
  invincibleTimer: number = 0;
  invincibleDuration: number = 1; // seconds

  constructor( image?: HTMLImageElement )
  {
    this.image = image;
  }

  update( deltaTime: number ): void
  {
    if ( this.invincible )
    {
      this.invincibleTimer -= deltaTime;
      if ( this.invincibleTimer <= 0 )
      {
        this.invincible = false;
      }
    }
  }

  draw( ctx: CanvasRenderingContext2D ): void
  {
    if ( this.image )
    {
      ctx.drawImage( this.image, this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2 );
    } else
    {
      ctx.beginPath();
      ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 );
      ctx.fillStyle = this.invincible ? 'rgba(0, 255, 0, 0.5)' : 'green';
      ctx.fill();
    }
  }

  makeInvincible()
  {
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
  }
}
