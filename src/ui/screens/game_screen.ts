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

  private player_circle!: THREE.Mesh;
  private target_circle!: THREE.Mesh;
  private line!: THREE.ArrowHelper;

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

  private distance_threshold: number = 10;

  private hud_canvas: HTMLCanvasElement;

  private floating_labels: {
    text: string;
    x: number;
    y: number;
    life: number; 
    color: string;
  }[] = [];

  private flying_points: {
    value: number;
    x: number;
    y: number;
    start_x: number;
    start_y: number;
    target_x: number;
    target_y: number;
    progress: number;
    color: string;
  }[] = [];

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

    this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas, antialias: true } );
    this.renderer.setSize( this.canvas.width, this.canvas.height );

    this.renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    this.renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight );
    this.renderer.setScissorTest( true );

    this.scene = new THREE.Scene();
    const width = window.innerWidth / 80;  // коефіцієнт масштабу
    const height = window.innerHeight / 80;

    console.log('width', width, 'height', height);

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

    // кружок під гравцем
    const ring_geo = new THREE.RingGeometry( 0.5, 0.6, 32 );
    const ring_mat = new THREE.MeshBasicMaterial( { color: 0x00ff00, transparent: true, opacity: 0.8, side: THREE.DoubleSide } );
    this.player_circle = new THREE.Mesh( ring_geo, ring_mat );
    this.player_circle.rotation.x = -Math.PI / 2;
    this.scene.add( this.player_circle );

    // кружок в точці цілі
    const target_geo = new THREE.RingGeometry( 0.3, 0.4, 32 );
    const target_mat = new THREE.MeshBasicMaterial( { color: 0xff4444, transparent: true, opacity: 0.8, side: THREE.DoubleSide } );
    this.target_circle = new THREE.Mesh( target_geo, target_mat );
    this.target_circle.rotation.x = -Math.PI / 2;
    this.scene.add( this.target_circle );

    const dir = new THREE.Vector3(
      this.player['target'].x - this.player.position.x,
      0,
      this.player['target'].y - this.player.position.y
    ).normalize();

    const length = this.player_circle.position.distanceTo( this.target_circle.position );

    if ( this.line ) this.scene.remove( this.line );
    this.line = new THREE.ArrowHelper( dir, new THREE.Vector3( this.player.position.x, 0.05, this.player.position.y ), length, 0xffffff, 0.6, 0.3 );
    this.scene.add( this.line );

    this.player.position = {
      x: 0,
      y: 0
    };

    if ( this.use_joystick )
    {
      this.joystick = new Joystick( this.canvas );
    } else
    {
      this.canvas.addEventListener( 'pointerdown', this.handlePointerDown, { passive: false } );

      this.canvas.addEventListener( 'pointermove', this.handlePointerMove, { passive: false } );
    }

    this.renderer.render(this.scene, this.camera);

    const max_dist = this.calcMaxDistanceFromCamera();
    this.distance_threshold = max_dist * 0.4;
    
    requestAnimationFrame( this.loop );
  }

  public getScore(): number
  {
    return Math.floor( this.score );
  }

  private spawnAmazingLabel( world_pos: THREE.Vector3 )
  {
    const elevated = world_pos.clone();
    elevated.y += 1.0;
    elevated.x -= 2.0;

    const screen = this.worldToScreen( elevated );

    this.floating_labels.push( {
      text: "AMAZING!",
      x: screen.x,
      y: screen.y - 20,
      life: 1.0,    
      color: "orange"
    } );
  }

  private spawnFlyingPoints( value: number, world_pos: THREE.Vector3 )
  {
    const elevated = world_pos.clone();
    elevated.y += 1.0;

    const screen = this.worldToScreen( elevated );

    this.flying_points.push( {
      value,
      x: screen.x,
      y: screen.y,
      start_x: screen.x,
      start_y: screen.y,
      target_x: 80,
      target_y: 30,
      progress: 0,
      color: "yellow"
    } );
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
    for ( let i = 0; i < this.enemies.length; i++ )
    {
      const e1 = this.enemies[i];
      e1.update( dt );

      for ( let j = i + 1; j < this.enemies.length; j++ )
      {
        const e2 = this.enemies[j];

        const dx = e1.position.x - e2.position.x;
        const dy = e1.position.y - e2.position.y;
        const dist = Math.hypot( dx, dy );

       const now = performance.now();

        if ( dist < e1.radius + e2.radius )
        {
          if ( now - e1.last_collision_time > 2000 && now - e2.last_collision_time > 2000 )
          {
            e1.last_collision_time = now;
            e2.last_collision_time = now;

            e1.freeze();
            e2.freeze();

            e1.playLoseAnimation();
            e2.playLoseAnimation();

            setTimeout( () =>
            {
              e1.unfreeze();
              e2.unfreeze();

              const dx = e2.position.x - e1.position.x;
              const dy = e2.position.y - e1.position.y;
              const len = Math.hypot( dx, dy ) || 1;
              const nx = dx / len;
              const ny = dy / len;

              const distance = 20;

              const new_end1 = {
                x: e1.position.x - nx * distance,
                y: e1.position.y - ny * distance
              };
              const new_end2 = {
                x: e2.position.x + nx * distance,
                y: e2.position.y + ny * distance
              };

              e1.resetPathFromCollision( new_end1 );
              e2.resetPathFromCollision( new_end2 );
            }, 1000 );
          }
        }
      }
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

    this.player_circle.position.set( this.player.position.x, 0.01, this.player.position.y );
    this.target_circle.position.set( this.player['target'].x, 0.01, this.player['target'].y );
    const scale = 1 + 0.2 * Math.sin( performance.now() * 0.005 );
    this.target_circle.scale.set( scale, scale, scale );

    const start = new THREE.Vector3( this.player.position.x, 0.05, this.player.position.y );
    const dir = new THREE.Vector3(
      this.player['target'].x - this.player.position.x,
      0,
      this.player['target'].y - this.player.position.y
    );
    const length = dir.length();

    if ( length > 0.1 )
    {
      dir.normalize();
      this.line.position.copy( start );
      this.line.setDirection( dir );
      this.line.setLength( length, 0.5, 0.3 );
      this.line.visible = true;
    } else
    {
      this.line.visible = false;
    }

    this.score += 2 * dt;

    if ( this.player.hasReachedTarget() )
    {
      const dist = this.player.consumePlannedDistance();
      if ( dist > this.distance_threshold )
      {
        // this.score += bonus;
        const bonus = Math.floor( 100 * Math.pow( dist / this.distance_threshold, 1.2 ) );
        const world_pos = new THREE.Vector3(
          this.player.position.x,
          2,               
          this.player.position.y
        );

        this.spawnAmazingLabel( world_pos );
        this.spawnFlyingPoints( bonus, world_pos );
        // this.showPopup( `+${bonus}` );
      }
    }

    // AMAZING labels
    for ( let i = this.floating_labels.length - 1; i >= 0; i-- )
    {
      const lbl = this.floating_labels[i];
      lbl.life -= dt;
      if ( lbl.life <= 0 )
      {
        this.floating_labels.splice( i, 1 );
      }
    }

    // Flying points
    for ( let i = this.flying_points.length - 1; i >= 0; i-- )
    {
      const f = this.flying_points[i];
      f.progress += dt / 1.0;
      if ( f.progress >= 1 )
      {
        this.score += f.value;  
        this.flying_points.splice( i, 1 );
      } else
      {
        const t = f.progress;
        f.x = f.start_x + ( f.target_x - f.start_x ) * t;
        f.y = f.start_y + ( f.target_y - f.start_y ) * t;
      }
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
    // AMAZING
    for ( const lbl of this.floating_labels )
    {
      const alpha = Math.max( 0, lbl.life );
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = lbl.color;
      this.ctx.font = "28px Arial Black";
      this.ctx.fillText( lbl.text, lbl.x, lbl.y );
      this.ctx.globalAlpha = 1;
    }

    // Flying points
    for ( const f of this.flying_points )
    {
      const alpha = 1 - f.progress;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = f.color;
      this.ctx.font = "24px Arial Black";
      this.ctx.fillText( "+" + f.value, f.x, f.y );
      this.ctx.globalAlpha = 1;
    }
  }

  private worldToScreen( pos: THREE.Vector3 ): { x: number, y: number }
  {
    const vector = pos.clone();
    vector.project( this.camera ); // переводимо в clip space

    const width = this.hud_canvas.width;
    const height = this.hud_canvas.height;

    return {
      x: ( vector.x + 1 ) / 2 * width,
      y: ( -vector.y + 1 ) / 2 * height
    };
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

  private handlePointerDown = ( ev: PointerEvent ): void =>
  {
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouse_x = ( ( ev.clientX - rect.left ) / rect.width ) * 2 - 1;
    const mouse_y = -( ( ev.clientY - rect.top ) / rect.height ) * 2 + 1;

    this.mouse.set( mouse_x, mouse_y );
    this.raycaster.setFromCamera( this.mouse, this.camera );

    if ( this.raycaster.ray.intersectPlane( this.ground_plane, this.plane_intersect ) )
    {
      this.player.setTarget( this.plane_intersect.x, this.plane_intersect.z );
    }
  };

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

  private calcMaxDistanceFromCamera(): number
  {
    const ndc_corners = [
      new THREE.Vector2( -1, -1 ), // нижній лівий
      new THREE.Vector2( 1, -1 ), // нижній правий
      new THREE.Vector2( -1, 1 ), // верхній лівий
      new THREE.Vector2( 1, 1 ), // верхній правий
    ];

    const world_points: THREE.Vector3[] = [];
    const raycaster = new THREE.Raycaster();

    for ( const ndc of ndc_corners )
    {
      raycaster.setFromCamera( ndc, this.camera );
      const hit = raycaster.ray.intersectPlane( this.ground_plane, new THREE.Vector3() );
      if ( hit ) world_points.push( hit.clone() );
    }

    let max_dist = 0;
    for ( let i = 0; i < world_points.length; i++ )
    {
      for ( let j = i + 1; j < world_points.length; j++ )
      {
        const d = world_points[i].distanceTo( world_points[j] );
        if ( d > max_dist ) max_dist = d;
      }
    }

    return max_dist;
  }
}
