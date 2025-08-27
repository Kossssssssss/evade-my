import * as THREE from "three";
import { AssetManager } from "../assets_manager";
import { getTrajectoryPosition, pathData, Trajectory } from "../utils/trajectory";
import { getSmoothRotation } from "../utils/direction";

const TRAJECTORIES: Trajectory[] = ["straight", "arc", "zigzag"];

export class Enemy
{
  public position: { x: number; y: number };
  public radius: number = 0.8;

  private speed: number = 0.8;
  private t: number = 0;

  private trajectory: Trajectory;
  private path_data: pathData = {};

  private start: { x: number; y: number };
  private end: { x: number; y: number };

  private zigzag_amplitude: number = 3;
  private zigzag_frequency: number = 2;

  public model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current_action?: THREE.AnimationAction;
  private is_attacking: boolean = false;

  constructor( scene: THREE.Scene, start: { x: number; y: number }, end: { x: number; y: number } )
  {
    this.start = start;
    this.end = end;
    this.position = { ...start };

    this.trajectory = TRAJECTORIES[Math.floor( Math.random() * TRAJECTORIES.length )];

    if ( this.trajectory === "arc" )
    {
      const mid_x = ( start.x + end.x ) / 2;
      const mid_y = ( start.y + end.y ) / 2;
      const offset = Math.random() * 50 - 5;

      this.path_data.control = { x: mid_x + offset, y: mid_y + offset };
    }

    this.model = AssetManager.getModel();
    this.model.scale.set( 1.5, 1.5, 1.5 );
    this.model.position.set( this.position.x, 0, this.position.y );

    const texture = AssetManager.getTexture( "purple" );
    this.model.traverse( ( child: any ) =>
    {
      if ( child.isMesh )
      {
        child.material = new THREE.MeshStandardMaterial( { map: texture } );
      }
    } );
    scene.add( this.model );

    const animations = AssetManager.getAnimations();
    if ( animations.length > 0 )
    {
      this.mixer = new THREE.AnimationMixer( this.model );
      for ( const clip of animations )
      {
        this.actions[clip.name] = this.mixer.clipAction( clip );
      }
      this.playAnimation( "Walk" );
    }
  }

  update( dt: number ): void
  {
    if ( !this.model ) return;

    if ( this.is_attacking )
    {
      this.mixer?.update( dt );
      return;
    }

    const prev_x = this.position.x;
    const prev_y = this.position.y;

    this.t = Math.min( 1, this.t + dt * ( this.speed * 0.15 ) );

    this.position = getTrajectoryPosition(
      this.trajectory,
      this.t,
      this.start,
      this.end,
      this.path_data,
      this.zigzag_amplitude,
      this.zigzag_frequency
    );

    this.model.position.set( this.position.x, 0, this.position.y );

    const dx = this.position.x - prev_x;
    const dy = this.position.y - prev_y;
    this.model.rotation.y = getSmoothRotation( this.model.rotation.y, dx, dy );

    if ( dx !== 0 || dy !== 0 )
    {
      const velocity = Math.hypot( dx, dy ) / dt;
      const base_speed = 2;
      const animation_speed = Math.max( 0.5, Math.min( 3, velocity / base_speed ) );
      if ( this.current_action )
      {
        this.current_action.timeScale = animation_speed;
      }
    }

    this.mixer?.update( dt );
  }

  public isAttacking(): boolean
  {
    return this.is_attacking;
  }

  public playAttackAnimation(
    player_position: { x: number; y: number },
    onHit?: () => void,
    onFinish?: () => void
  )
  {
    if ( !this.mixer || this.is_attacking ) return;
    this.is_attacking = true;

    const key = Object.keys( this.actions ).find( ( k ) => k.toLowerCase().includes( "attack1" ) );
    if ( !key ) return;

    if ( this.model )
    {
      const dx = player_position.x - this.position.x;
      const dy = player_position.y - this.position.y;
      this.model.rotation.y = Math.atan2( dx, dy );
    }

    const action = this.actions[key];
    if ( this.current_action ) this.current_action.fadeOut( 0.2 );

    this.current_action = action;
    this.current_action
      .reset()
      .setLoop( THREE.LoopOnce, 1 )
      .play().clampWhenFinished = true;
    this.current_action.timeScale = 1.5;

    const hitDelay = ( action.getClip().duration / this.current_action.timeScale ) * 0.3;
    setTimeout( () => onHit?.(), hitDelay * 1000 );

    this.mixer.addEventListener( "finished", ( e ) =>
    {
      if ( e.action === this.current_action )
      {
        onFinish?.();
      }
    } );
  }

  private playAnimation( partialName: string )
  {
    if ( !this.mixer ) return;
    const key = Object.keys( this.actions ).find( ( k ) =>
      k.toLowerCase().includes( partialName.toLowerCase() )
    );
    if ( !key ) return;

    const action = this.actions[key];
    if ( this.current_action === action ) return;

    if ( this.current_action ) this.current_action.fadeOut( 0.3 );
    this.current_action = action;
    this.current_action.reset().fadeIn( 0.3 ).play();
  }
}
