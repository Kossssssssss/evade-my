import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class AssetManager
{
  private static gltf: any;
  private static textures: Record<string, THREE.Texture> = {};

  static async loadAll(): Promise<void>
  {
    const loader = new GLTFLoader();
    const tex_loader = new THREE.TextureLoader();

    this.gltf = await new Promise( ( resolve, reject ) =>
    {
      loader.load( '/assets/all.glb', resolve, undefined, reject );
    } );

    this.textures['green'] = tex_loader.load( '/assets/green_texture.png' );
    this.textures['purple'] = tex_loader.load( '/assets/purple_texture.png' );
  }

  static getModel(): THREE.Object3D
  {
    return SkeletonUtils.clone( this.gltf.scene );
  }

  static getTexture( name: string ): THREE.Texture
  {
    return this.textures[name];
  }

  static getAnimations(): THREE.AnimationClip[]
  {
    return this.gltf.animations;
  }
}
