import { Player } from '../../entities/player.js';
import { Enemy } from '../../entities/enemy.js';
import { ScreenManager } from '../../screen_manager.js';
import { Joystick } from '../../joystick.js';
import { locations } from '../../configs/location_config.js';
import { FallingItem } from '../../entities/falling_item.js';
import { WaveController } from '../../wave_controller.js';
import * as THREE from 'three';
import { AssetManager } from '../../assets_manager.js';
import { LoaderScreen } from './loader_screen.js';

export class GameScreen
{
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screen_manager: ScreenManager;
  private is_losing: boolean = false;

  private player!: Player;
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

  private score_point: number = 10;

  private falling_items: FallingItem[] = [];
  private last_item_spawn: number = 0;
  private item_spawn_interval: number = 2;

  private wave_controller!: WaveController;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;

  private raycaster = new THREE.Raycaster();
  private ground_plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // площина y=0
  private plane_intersect = new THREE.Vector3();
  private mouse = new THREE.Vector2();

  private hud_canvas: HTMLCanvasElement;

  constructor( canvas: HTMLCanvasElement, screen_manager: ScreenManager )
  {
    this.canvas = canvas;
    this.hud_canvas = document.getElementById( 'hudCanvas' ) as HTMLCanvasElement;
    this.ctx = this.hud_canvas.getContext( '2d' )!;
    this.screen_manager = screen_manager;
  }
  public setConfig( location_index: number, use_joystick: boolean, use_images: boolean ): void
  {
    this.location_index = location_index;
    this.use_joystick = use_joystick;

    const config = locations[location_index];
    this.spawn_interval = 1 / config.spawn_rate;
    this.enemy_speed = config.enemy_speed;
    this.score_point = config.score_point;
  }

  public async init(): Promise<void>
  {
    if ( !AssetManager.ready() )
    {
      const loaderScreen = new LoaderScreen( this.hud_canvas );
      loaderScreen.start();

      await AssetManager.loadAll();

      loaderScreen.stop();
      console.log( "✅ Assets loaded!" );
    }

    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.is_losing = false;
    this.running = true;
    this.score = 0;
    this.enemies = [];
    this.lives = 3;
    this.last_spawn_time = performance.now() / 1000;

    this.wave_controller = new WaveController( 5, 15, 8 );

    this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas } );
    this.renderer.setSize( this.canvas.width, this.canvas.height );

    this.renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    this.renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight );
    this.renderer.setScissorTest( true );

    this.scene = new THREE.Scene();
    const width = window.innerWidth / 80;  // коефіцієнт масштабу
    const height = window.innerHeight / 80;

    this.camera = new THREE.OrthographicCamera(
      -width, width,
      height, -height,
      0.1, 1000
    );
    this.camera.position.set( 20, 20, 20 );
    this.camera.lookAt( 0, 0, 0 );
    const groundGeometry = new THREE.PlaneGeometry( 2000, 2000 );
    const groundMaterial = new THREE.MeshStandardMaterial( {
      color: 0x225522,
      roughness: 1,
      metalness: 0
    } );
    const ground = new THREE.Mesh( groundGeometry, groundMaterial );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add( ground );

    const light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 5, 10, 5 );
    this.scene.add( light );

    this.player = new Player( this.scene );

    this.player.position = {
      x: 0,
      y: 0
    };

    if ( this.use_joystick )
    {
      this.joystick = new Joystick( this.canvas );
    } else
    {
      this.canvas.addEventListener( 'pointermove', this.handlePointerMove, { passive: false } );
    }

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame( this.loop );
  }

  public getScore(): number
  {
    return Math.floor( this.score );
  }

  private removeEnemy( enemy: Enemy ): void
  {
    if ( enemy.model )
    {
      this.scene.remove( enemy.model );
      enemy.model.traverse( ( child: any ) =>
      {
        if ( child.geometry ) child.geometry.dispose();
        if ( child.material )
        {
          if ( Array.isArray( child.material ) )
          {
            child.material.forEach( ( m: THREE.Material ) => m.dispose() );
          } else
          {
            child.material.dispose();
          }
        }
      } );
    }

    this.enemies.splice( this.enemies.indexOf( enemy ), 1 );
  }

  private last_time = performance.now();
  private loop = (): void =>
  {
    if ( !this.running ) return;

    const now = performance.now();
    const dt = ( now - this.last_time ) / 1000; // секунди
    this.last_time = now;

    this.update( dt );
    this.draw();
    requestAnimationFrame( this.loop );
  };

  private onWaveEnd(): void
  {
    while ( this.enemies.length > 0 )
    {
      this.removeEnemy( this.enemies[0] );
    }
  }

  private updateEnemies( dt: number ): void
  {
    for ( const enemy of this.enemies )
    {
      enemy.update( dt );
    }
  }

  private checkGameOver(): boolean
  {
    if ( this.lives > 0 || this.is_losing ) return false;

    this.is_losing = true;
    this.player.playLoseAnimation();

    setTimeout( () =>
    {
      this.destroy();
      this.screen_manager.showScreen( 'results' );
    }, 2000 );

    return true;
  }

  private endGame(): void
  {
    this.destroy();
    this.screen_manager.showScreen( 'results' );
  }

  private handleJoystick( dt: number ): void
  {
    if ( !this.use_joystick || !this.joystick ) return;

    const dir = this.joystick.getDirection();
    if ( dir.x === 0 && dir.y === 0 ) return;

    const len = Math.hypot( dir.x, dir.y );
    const nx = dir.x / len;
    const ny = dir.y / len;

    const strength = Math.min( len, 1 );
    const move_distance = this.player.speed * 0.5;

    this.player.setTarget(
      this.player.position.x + nx * move_distance * strength,
      this.player.position.y + ny * move_distance * strength
    );
  }

  private checkCollisions(): void
  {
    this.enemies.forEach( enemy =>
    {
      if ( enemy.isAttacking() ) return;

      const dx = this.player.position.x - enemy.position.x;
      const dy = this.player.position.y - enemy.position.y;
      const dist = Math.hypot( dx, dy );

      if ( dist < this.player.radius + enemy.radius )
      {
        this.handlePlayerHit( enemy );
      }
    } );
  }

  private handlePlayerHit( enemy: Enemy ): void
  {
    this.player.freeze();
    this.player.stopAnimation();
    this.lives--;

    const onHit = () => { if ( this.lives > 0 ) this.player.playHitAnimation(); };
    const onFinished = () => { this.removeEnemy( enemy ); this.player.unfreeze(); };

    enemy.playAttackAnimation( this.player.position, onHit, onFinished );
  }

  private handleSpawns( now: number ): void
  {
    if ( this.wave_controller.inWave() && now - this.last_spawn_time >= this.spawn_interval )
    {
      this.spawnEnemy();
      this.last_spawn_time = now;
    }

    if ( this.wave_controller.isCollecting() )
    {
      if ( now - this.last_item_spawn >= this.item_spawn_interval / 4 )
      {
        for ( let i = 0; i < 5; i++ ) this.spawnFallingItem( true );
        this.last_item_spawn = now;
      }
    } else if ( now - this.last_item_spawn >= this.item_spawn_interval )
    {
      this.spawnFallingItem();
      this.last_item_spawn = now;
    }
  }

  private update( dt: number ): void
  {
    const now = performance.now() / 1000;

    this.wave_controller.update( dt );
    this.player.update( dt );

    this.handleSpawns( now );
    this.updateEnemies( dt );
    this.checkCollisions();

    this.handleJoystick( dt );

    if ( this.checkGameOver() ) return;
    if ( this.wave_controller.isFinished() )
    {
      this.endGame();
      return;
    }

    if ( this.wave_controller.isPaused() )
    {
      this.onWaveEnd();
    }
  }

  private spawnFallingItem( from_sides: boolean = false ): void
  {
    let x = 0, y = 0;
    let vx = 0, vy = 0;

    const speed = 400;

    if ( from_sides )
    {
      const side = Math.floor( Math.random() * 4 );

      switch ( side )
      {
        case 0: // top
          x = Math.random() * this.canvas.width;
          y = -10;
          vx = 0;
          vy = speed;
          break;
        case 1: // bottom
          x = Math.random() * this.canvas.width;
          y = this.canvas.height + 10;
          vx = 0;
          vy = -speed;
          break;
        case 2: // left
          x = -10;
          y = Math.random() * this.canvas.height;
          vx = speed;
          vy = 0;
          break;
        case 3: // right
          x = this.canvas.width + 10;
          y = Math.random() * this.canvas.height;
          vx = -speed;
          vy = 0;
          break;
      }
    }
    else
    {
      x = Math.random() * ( this.canvas.width - 20 ) + 10;
      y = -10;
      vx = 0;
      vy = 150;
    }

    const item = new FallingItem( x, y, vx, vy );
    this.falling_items.push( item );
  }

  public destroy(): void
  {
    this.running = false;

    this.canvas.removeEventListener( 'pointermove', this.handlePointerMove );
    this.joystick = undefined;

    while ( this.enemies.length > 0 )
    {
      this.removeEnemy( this.enemies[0] );
    }
    this.enemies = [];

    for ( const item of this.falling_items )
    {
      if ( ( item as any ).model )
      {
        this.scene.remove( ( item as any ).model );
      }
    }
    this.falling_items = [];

    if ( this.player.model )
    {
      this.scene.remove( this.player.model );
      this.player.model.traverse( ( child: any ) =>
      {
        if ( child.geometry ) child.geometry.dispose();
        if ( child.material )
        {
          if ( Array.isArray( child.material ) )
          {
            child.material.forEach( ( m: THREE.Material ) => m.dispose() );
          } else
          {
            child.material.dispose();
          }
        }
      } );
    }

    while ( this.scene.children.length > 0 )
    {
      const obj = this.scene.children[0];
      this.scene.remove( obj );

      obj.traverse?.( ( child: any ) =>
      {
        if ( child.geometry ) child.geometry.dispose();
        if ( child.material )
        {
          if ( Array.isArray( child.material ) )
          {
            child.material.forEach( ( m: THREE.Material ) => m.dispose() );
          } else
          {
            child.material.dispose();
          }
        }
      } );
    }

    this.renderer.dispose();
  }

  private draw(): void
  {
    this.renderer.render( this.scene, this.camera );

    this.ctx.clearRect( 0, 0, this.hud_canvas.width, this.hud_canvas.height );
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    const padding = 20;
    this.ctx.fillText( `Score: ${Math.floor( this.score )}`, padding, padding );
    this.ctx.fillText( `Lives: ${this.lives}`, padding, padding + 30 );
    this.ctx.fillText(
      `Wave: ${this.wave_controller.getCurrentWave()} / ${this.wave_controller.getTotalWaves()}`,
      padding, padding + 60
    );
    this.ctx.fillText(
      `Time left: ${Math.ceil( this.wave_controller.getTimer() )}`,
      padding, padding + 90
    );
    if ( this.use_joystick && this.joystick )
    {
      this.joystick.draw( this.ctx );
    }
  }

  private spawnEnemy(): void
  {
    const left = this.camera.left;
    const right = this.camera.right;
    const top = this.camera.top;
    const bottom = this.camera.bottom;
    const margin = 10;

    let start = { x: 0, y: 0 };
    let end = { x: 0, y: 0 };

    const side = Math.floor( Math.random() * 4 );
    switch ( side )
    {
      case 0: // зліва → вправо
        start = { x: left - margin, y: Math.random() * ( top - bottom ) + bottom };
        end = { x: right + margin, y: Math.random() * ( top - bottom ) + bottom };
        break;

      case 1: // справа → вліво
        start = { x: right + margin, y: Math.random() * ( top - bottom ) + bottom };
        end = { x: left - margin, y: Math.random() * ( top - bottom ) + bottom };
        break;

      case 2: // зверху → вниз
        start = { x: Math.random() * ( right - left ) + left, y: top + margin };
        end = { x: Math.random() * ( right - left ) + left, y: bottom - margin };
        break;

      case 3: // знизу → вверх
        start = { x: Math.random() * ( right - left ) + left, y: bottom - margin };
        end = { x: Math.random() * ( right - left ) + left, y: top + margin };
        break;
    }

    const enemy = new Enemy( this.scene, start, end );
    this.enemies.push( enemy );
  }

  private handlePointerMove = ( ev: PointerEvent ): void =>
  {
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouse_x = ( ( ev.clientX - rect.left ) / rect.width ) * 2 - 1;
    const mouse_y = -( ( ev.clientY - rect.top ) / rect.height ) * 2 + 1;

    this.mouse.x = mouse_x;
    this.mouse.y = mouse_y;

    this.raycaster.setFromCamera( this.mouse, this.camera );

    if ( this.raycaster.ray.intersectPlane( this.ground_plane, this.plane_intersect ) )
    {
      this.player.setTarget( this.plane_intersect.x, this.plane_intersect.z );
    }
  };
}
