import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { ScreenManager } from '../screen_manager.js';
import { Joystick } from '../joystick.js';
import { locations } from '../configs/location_config.js';
import { FallingItem } from '../entities/falling_item.js';

export class GameScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screen_manager: ScreenManager;

  private player: Player;
  private enemies: Enemy[] = [];
  private score: number = 0;
  private running: boolean = false;
  private lives: number = 3;

  private last_spawn_time: number = 0;
  private spawn_interval: number = 0.4;
  private enemy_speed: number = 200;

  private location_index: number = 0;
  private use_joystick: boolean = false;

  private joystick?: Joystick;
  private player_speed: number = 300;

  private score_point: number = 10;

  private falling_items: FallingItem[] = [];
  private last_item_spawn: number = 0;
  private item_spawn_interval: number = 2;

  public constructor( canvas: HTMLCanvasElement, screen_manager: ScreenManager )
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext( '2d' )!;
    this.screen_manager = screen_manager;
    this.player = new Player();
  }

  public setConfig( location_index: number, use_joystick: boolean ): void
  {
    this.location_index = location_index;
    this.use_joystick = use_joystick;

    const config = locations[location_index];
    this.spawn_interval = 1 / config.spawn_rate;
    this.enemy_speed = config.enemy_speed;
    this.score_point = config.score_point;
  }

  public init(): void
  {
    this.running = true;
    this.score = 0;
    this.enemies = [];
    this.lives = 3;
    this.last_spawn_time = performance.now() / 1000;
    this.player.position = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    };

    if ( this.use_joystick )
    {
      this.joystick = new Joystick( this.canvas );
    } else
    {
      this.canvas.addEventListener( 'pointermove', this.handlePointerMove );
    }

    requestAnimationFrame( this.loop );
  }

  public getScore(): number
  {
    return Math.floor( this.score );
  }

  private loop = (): void =>
  {
    if ( !this.running ) return;

    this.update( 1 / 60 );
    this.draw();
    requestAnimationFrame( this.loop );
  };

  private update( dt: number ): void
  {
    const now = performance.now() / 1000;

    if ( now - this.last_spawn_time >= this.spawn_interval )
    {
      this.spawnEnemy();
      this.last_spawn_time = now;
    }

    if ( now - this.last_item_spawn >= this.item_spawn_interval )
    {
      this.spawnFallingItem();
      this.last_item_spawn = now;
    }

    for ( const item of this.falling_items )
    {
      item.update( dt );
    }

    this.falling_items = this.falling_items.filter( item =>
    {
      const dx = item.position.x - this.player.position.x;
      const dy = item.position.y - this.player.position.y;
      const dist = Math.hypot( dx, dy );
      const caught = dist < item.radius + this.player.radius;
      if ( caught ) this.score += this.score_point;
      return !caught && item.position.y < this.canvas.height + item.radius;
    } );

    for ( const enemy of this.enemies )
    {
      enemy.update( dt );
    }

    this.enemies = this.enemies.filter( enemy =>
    {
      const dx = this.player.position.x - enemy.position.x;
      const dy = this.player.position.y - enemy.position.y;
      const dist = Math.hypot( dx, dy );
      const collided = dist < this.player.radius + enemy.radius;
      if ( collided ) this.lives--;
      return !collided;
    } );

    if ( this.lives <= 0 )
    {
      this.destroy();
      this.screen_manager.showScreen( 'results' );
      return;
    }

    if ( this.use_joystick && this.joystick )
    {
      const dir = this.joystick.getDirection();
      this.player.position.x += dir.x * this.player_speed * dt;
      this.player.position.y += dir.y * this.player_speed * dt;

      this.player.position.x = Math.max( this.player.radius, Math.min( this.canvas.width - this.player.radius, this.player.position.x ) );
      this.player.position.y = Math.max( this.player.radius, Math.min( this.canvas.height - this.player.radius, this.player.position.y ) );
    }
  }

  private spawnFallingItem(): void
  {
    const x = Math.random() * ( this.canvas.width - 20 ) + 10;
    const item = new FallingItem( x );
    this.falling_items.push( item );
  }

  public destroy(): void
  {
    this.running = false;
    this.canvas.removeEventListener( 'pointermove', this.handlePointerMove );
    this.joystick = undefined;
  }

  private draw(): void
  {
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

    this.player.draw( this.ctx );
    for ( const enemy of this.enemies )
    {
      enemy.draw( this.ctx );
    }

    for ( const item of this.falling_items )
    {
      item.draw( this.ctx );
    }

    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText( `Score: ${Math.floor( this.score )}`, 10, 30 );
    this.ctx.fillText( `Lives: ${this.lives}`, 10, 60 );

    if ( this.use_joystick && this.joystick )
    {
      this.joystick.draw( this.ctx );
    }
  }

  private spawnEnemy(): void
  {
    const side = Math.floor( Math.random() * 4 );
    const radius = 20;
    let x = 0, y = 0;

    switch ( side )
    {
      case 0: y = -radius; x = Math.random() * this.canvas.width; break; // top
      case 1: y = this.canvas.height + radius; x = Math.random() * this.canvas.width; break; // bottom
      case 2: x = -radius; y = Math.random() * this.canvas.height; break; // left
      case 3: x = this.canvas.width + radius; y = Math.random() * this.canvas.height; break; // right
    }

    const dx = this.player.position.x - x;
    const dy = this.player.position.y - y;
    const len = Math.hypot( dx, dy ) || 1;
    const speed = this.enemy_speed;
    const vx = ( dx / len ) * speed;
    const vy = ( dy / len ) * speed;

    const enemy = new Enemy( { x, y }, { x: vx, y: vy } );
    this.enemies.push( enemy );
  }

  private handlePointerMove = ( ev: PointerEvent ): void =>
  {
    const rect = this.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    this.player.position = { x, y };
  };
}
