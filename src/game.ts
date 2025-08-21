import { Vector2 } from './interfaces.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { locations } from './locationConfig.js';
import { ScoreEntry } from './score_entry.js';

export class Game
{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  player: Player;
  enemies: Enemy[] = [];
  lives: number = 3;
  score: number = 0;
  bestScore: number = 0;
  leaderboard: ScoreEntry[] = [];
  gameOver: boolean = false;
  shakeTimer: number = 0;
  shakeDuration: number = 0.3; // seconds
  shakeIntensity: number = 5;
  lastSpawnTime: number = 0;
  spawnInterval: number = 1; // will be set based on location
  touchPosition: Vector2 | null = null;
  useJoystick: boolean = false;
  joystickBase: Vector2 | null = null;
  joystickPosition: Vector2 | null = null;
  joystickRadius: number = 50;
  selectedLocation: number = 0;
  state: 'menu' | 'playing' | 'gameover' = 'menu';
  images: { [key: string]: HTMLImageElement } = {};
  // atlas?: HTMLImageElement; // If using sprite atlas

  constructor( canvas: HTMLCanvasElement )
  {
    this.canvas = canvas;
    this.ctx = canvas.getContext( '2d' )!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.player = new Player(); // Will set image later if loaded

    // Preload images
    this.preloadImages();

    // Event listeners
    this.canvas.addEventListener( 'touchstart', this.handleTouchStart.bind( this ) );
    this.canvas.addEventListener( 'touchmove', this.handleTouchMove.bind( this ) );
    this.canvas.addEventListener( 'touchend', this.handleTouchEnd.bind( this ) );
    // For desktop testing
    this.canvas.addEventListener( 'mousedown', ( e ) => this.handleTouchStart( this.mouseToTouch( e ) ) );
    this.canvas.addEventListener( 'mousemove', ( e ) => this.handleTouchMove( this.mouseToTouch( e ) ) );
    this.canvas.addEventListener( 'mouseup', this.handleTouchEnd.bind( this ) );

    // Load best scores and leaderboards from localStorage
    this.loadScores();
  }

  preloadImages()
  {
    // Example: separate images
    const playerImg = new Image();
    playerImg.src = 'assets/player.jpg';
    playerImg.onload = () => { this.player.image = playerImg; };

    const enemyImg = new Image();
    enemyImg.src = 'assets/enemy.jpg';
    // For enemies, you can assign in spawnEnemy if needed

    // Or use atlas: load one image, and draw subsets
    // this.atlas = new Image();
    // this.atlas.src = 'assets/atlas.png';
    // Then in objects, set spriteOffset and spriteSize
  }

  loadScores()
  {
    const loc = locations[this.selectedLocation];
    const key = `best_${loc.name}`;
    this.bestScore = parseInt( localStorage.getItem( key ) || '0' );
    const lbKey = `leaderboard_${loc.name}`;
    this.leaderboard = JSON.parse( localStorage.getItem( lbKey ) || '[]' )
      .map( ( e: any ) => ( { score: e.score, date: new Date( e.date ) } ) )
      .sort( ( a: ScoreEntry, b: ScoreEntry ) => b.score - a.score )
      .slice( 0, 10 ); // Top 10
  }

  saveScores()
  {
    const loc = locations[this.selectedLocation];
    const key = `best_${loc.name}`;
    const newBest = Math.max( this.bestScore, this.score );
    localStorage.setItem( key, newBest.toString() );
    this.bestScore = newBest;
    const lbKey = `leaderboard_${loc.name}`;
    this.leaderboard.push( { score: this.score, date: new Date() } );
    this.leaderboard.sort( ( a, b ) => b.score - a.score );
    this.leaderboard = this.leaderboard.slice( 0, 10 );
    localStorage.setItem( lbKey, JSON.stringify( this.leaderboard ) );
  }

  startGame( locationIndex: number )
  {
    this.selectedLocation = locationIndex;
    const config = locations[locationIndex];
    this.spawnInterval = 1 / config.spawnRate;
    this.player.position = { x: this.width / 2, y: this.height / 2 };
    this.enemies = [];
    this.lives = 3;
    this.score = 0;
    this.gameOver = false;
    this.state = 'playing';
    this.lastSpawnTime = performance.now() / 1000;
    this.loadScores(); // Reload for the selected location
  }

  update( deltaTime: number )
  {
    if ( this.state !== 'playing' ) return;

    this.score += deltaTime * 10; // Example scoring

    this.player.update( deltaTime );

    // Handle movement
    if ( this.useJoystick && this.joystickBase && this.joystickPosition )
    {
      const dx = this.joystickPosition.x - this.joystickBase.x;
      const dy = this.joystickPosition.y - this.joystickBase.y;
      const dist = Math.sqrt( dx * dx + dy * dy );
      const speed = 300;
      if ( dist > 0 )
      {
        const normDist = Math.min( dist, this.joystickRadius ) / this.joystickRadius;
        this.player.position.x += ( dx / dist ) * normDist * speed * deltaTime;
        this.player.position.y += ( dy / dist ) * normDist * speed * deltaTime;
      }
      this.player.position.x = Math.max( this.player.radius, Math.min( this.width - this.player.radius, this.player.position.x ) );
      this.player.position.y = Math.max( this.player.radius, Math.min( this.height - this.player.radius, this.player.position.y ) );
    } else if ( this.touchPosition )
    {
      this.player.position = { ...this.touchPosition };
    }

    // Spawn enemies
    const currentTime = performance.now() / 1000;
    if ( currentTime - this.lastSpawnTime > this.spawnInterval )
    {
      this.spawnEnemy();
      this.lastSpawnTime = currentTime;
    }

    // Update enemies
    this.enemies.forEach( enemy => enemy.update( deltaTime ) );
    this.enemies = this.enemies.filter( enemy => !enemy.isOffScreen( this.width, this.height ) );

    // Check collisions
    if ( !this.player.invincible )
    {
      for ( let i = 0; i < this.enemies.length; i++ )
      {
        const enemy = this.enemies[i];
        const dx = this.player.position.x - enemy.position.x;
        const dy = this.player.position.y - enemy.position.y;
        const dist = Math.sqrt( dx * dx + dy * dy );
        if ( dist < this.player.radius + enemy.radius )
        {
          this.lives--;
          this.player.makeInvincible();
          this.shakeTimer = this.shakeDuration;
          this.enemies.splice( i, 1 );
          if ( this.lives <= 0 )
          {
            this.gameOver = true;
            this.state = 'gameover';
            this.saveScores();
          }
          break;
        }
      }
    }

    // Shake
    if ( this.shakeTimer > 0 )
    {
      this.shakeTimer -= deltaTime;
    }
  }

  draw()
  {
    const config = locations[this.selectedLocation];
    this.ctx.fillStyle = config.backgroundColor;
    this.ctx.fillRect( 0, 0, this.width, this.height );

    const shakeX = this.shakeTimer > 0 ? ( Math.random() - 0.5 ) * this.shakeIntensity * 2 : 0;
    const shakeY = this.shakeTimer > 0 ? ( Math.random() - 0.5 ) * this.shakeIntensity * 2 : 0;
    this.ctx.save();
    this.ctx.translate( shakeX, shakeY );

    this.player.draw( this.ctx );
    this.enemies.forEach( enemy => enemy.draw( this.ctx ) );

    // Draw UI
    this.ctx.restore();  // Restore before UI to avoid shaking UI
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText( `Lives: ${this.lives}`, 10, 30 );
    this.ctx.fillText( `Score: ${Math.floor( this.score )}`, 10, 60 );

    // Joystick
    if ( this.useJoystick && this.joystickBase )
    {
      this.ctx.beginPath();
      this.ctx.arc( this.joystickBase.x, this.joystickBase.y, this.joystickRadius, 0, Math.PI * 2 );
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.stroke();
      if ( this.joystickPosition )
      {
        this.ctx.beginPath();
        this.ctx.arc( this.joystickPosition.x, this.joystickPosition.y, this.joystickRadius / 2, 0, Math.PI * 2 );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fill();
      }
    }

    if ( this.state === 'menu' )
    {
      this.drawMenu();
    } else if ( this.state === 'gameover' )
    {
      this.drawGameOver();
    }
  }

  drawMenu()
  {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect( 0, 0, this.width, this.height );
    this.ctx.fillStyle = 'white';
    this.ctx.font = '30px Arial';
    this.ctx.fillText( 'Select Location', this.width / 2 - 150, this.height / 2 - 100 );
    locations.forEach( ( loc, i ) =>
    {
      this.ctx.fillText( loc.name, this.width / 2 - 100, this.height / 2 - 50 + i * 50 );
    } );
    this.ctx.fillText( 'Use Joystick? ' + ( this.useJoystick ? 'Yes' : 'No' ), this.width / 2 - 150, this.height / 2 + 100 + locations.length * 50 );
  }

  drawGameOver()
  {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect( 0, 0, this.width, this.height );
    this.ctx.fillStyle = 'white';
    this.ctx.font = '30px Arial';
    this.ctx.fillText( 'Game Over', this.width / 2 - 100, this.height / 2 - 150 );
    this.ctx.fillText( `Score: ${Math.floor( this.score )}`, this.width / 2 - 100, this.height / 2 - 100 );
    this.ctx.fillText( `Best: ${this.bestScore}`, this.width / 2 - 100, this.height / 2 - 50 );
    this.ctx.fillText( 'Leaderboard:', this.width / 2 - 100, this.height / 2 );
    this.leaderboard.forEach( ( entry, i ) =>
    {
      this.ctx.fillText( `${i + 1}. ${entry.score} (${entry.date.toLocaleDateString()})`, this.width / 2 - 100, this.height / 2 + 30 + i * 30 );
    } );
    this.ctx.fillText( 'Restart', this.width / 2 - 50, this.height / 2 + 200 + this.leaderboard.length * 30 );
  }

  spawnEnemy()
  {
    const config = locations[this.selectedLocation];
    const side = Math.floor( Math.random() * 4 );
    let position: Vector2 = { x: 0, y: 0 };
    let velocity: Vector2 = { x: 0, y: 0 };
    const speed = config.enemySpeed;
    const directionX = ( this.width / 2 - position.x ) / this.width * speed * ( Math.random() + 0.5 );  // Bias towards center
    const directionY = ( this.height / 2 - position.y ) / this.height * speed * ( Math.random() + 0.5 );

    switch ( side )
    {
      case 0: // Top
        position = { x: Math.random() * this.width, y: -this.player.radius };
        velocity = { x: directionX, y: speed };
        break;
      case 1: // Bottom
        position = { x: Math.random() * this.width, y: this.height + this.player.radius };
        velocity = { x: directionX, y: -speed };
        break;
      case 2: // Left
        position = { x: -this.player.radius, y: Math.random() * this.height };
        velocity = { x: speed, y: directionY };
        break;
      case 3: // Right
        position = { x: this.width + this.player.radius, y: Math.random() * this.height };
        velocity = { x: -speed, y: directionY };
        break;
    }

    // Normalize if needed, but since we set magnitude to speed, it's fine
    const mag = Math.sqrt( velocity.x ** 2 + velocity.y ** 2 );
    if ( mag > 0 )
    {
      velocity.x = ( velocity.x / mag ) * speed;
      velocity.y = ( velocity.y / mag ) * speed;
    }

    const enemy = new Enemy( position, velocity );
    // If you have enemy image, enemy.image = this.images['enemy'];
    this.enemies.push( enemy );
  }

  handleTouchStart( event: any )
  {
    event.preventDefault();
    const touch = this.getTouch( event );
    if ( !touch ) return;

    if ( this.state === 'menu' )
    {
      const locY = touch.y - ( this.height / 2 - 50 );
      if ( locY > 0 && locY < locations.length * 50 )
      {
        const index = Math.floor( locY / 50 );
        this.startGame( index );
      }
      const joyY = touch.y - ( this.height / 2 + 100 + locations.length * 50 - 20 );
      if ( joyY > 0 && joyY < 40 )
      {
        this.useJoystick = !this.useJoystick;
      }
    } else if ( this.state === 'gameover' )
    {
      const restartY = touch.y - ( this.height / 2 + 200 + this.leaderboard.length * 30 - 20 );
      if ( restartY > 0 && restartY < 40 )
      {
        this.state = 'menu';
      }
    } else if ( this.state === 'playing' )
    {
      if ( this.useJoystick )
      {
        this.joystickBase = { x: touch.x, y: touch.y };
        this.joystickPosition = { x: touch.x, y: touch.y };
      } else
      {
        this.touchPosition = { x: touch.x, y: touch.y };
      }
    }
  }

  handleTouchMove( event: any )
  {
    event.preventDefault();
    const touch = this.getTouch( event );
    if ( !touch ) return;

    if ( this.state === 'playing' )
    {
      if ( this.useJoystick && this.joystickBase )
      {
        let dx = touch.x - this.joystickBase.x;
        let dy = touch.y - this.joystickBase.y;
        const dist = Math.sqrt( dx * dx + dy * dy );
        if ( dist > this.joystickRadius )
        {
          dx = ( dx / dist ) * this.joystickRadius;
          dy = ( dy / dist ) * this.joystickRadius;
        }
        this.joystickPosition = { x: this.joystickBase.x + dx, y: this.joystickBase.y + dy };
      } else
      {
        this.touchPosition = { x: touch.x, y: touch.y };
      }
    }
  }

  handleTouchEnd()
  {
    if ( this.useJoystick )
    {
      this.joystickBase = null;
      this.joystickPosition = null;
    } else
    {
      this.touchPosition = null;
    }
  }

  getTouch( event: any ): Vector2 | null
  {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;
    if ( event.touches && event.touches.length > 0 )
    {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else
    {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    if ( clientX === undefined || clientY === undefined ) return null;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  mouseToTouch( e: MouseEvent ): any
  {
    return e;
  }

  private lastTime?: number;

  loop = () =>
  {
    const now = performance.now();
    const deltaTime = ( now - ( this.lastTime || now ) ) / 1000;
    this.lastTime = now;

    this.update( deltaTime );
    this.draw();

    requestAnimationFrame( this.loop );
  }

  run()
  {
    this.loop();
  }
}
