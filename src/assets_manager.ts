import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class AssetManager {
  private static gltf: any;
  private static textures: Record<string, THREE.Texture> = {};

  private static is_loading: boolean = false;
  private static is_loaded:  boolean = false;

  private static load_promise?: Promise<void>;

  static loadAll(): Promise<void> {
    if (this.load_promise) return this.load_promise;
    if (this.is_loaded) return Promise.resolve();

    this.is_loading = true;

    const loader = new GLTFLoader();
    const tex_loader = new THREE.TextureLoader();

    this.load_promise = new Promise((resolve, reject) => {
      loader.load(
        import.meta.env.BASE_URL + 'assets/all.glb',
        (gltf) => {
          this.gltf = gltf;

          this.textures['green'] = tex_loader.load( import.meta.env.BASE_URL + 'assets/green_texture.png');
          this.textures['purple'] = tex_loader.load( import.meta.env.BASE_URL + 'assets/purple_texture.png');

          this.is_loading = false;
          this.is_loaded = true;
          resolve();
        },
        undefined,
        (err) => {
          this.is_loading = false;
          reject(err);
        }
      );
    });

    return this.load_promise;
  }

  static ready(): boolean {
    return this.is_loaded;
  }

  static loading(): boolean {
    return this.is_loading;
  }

  static getModel(): THREE.Object3D {
    if (!this.is_loaded) throw new Error("Assets not loaded yet!");

    return SkeletonUtils.clone(this.gltf.scene);
  }

  static getTexture(name: string): THREE.Texture {
    if (!this.is_loaded) throw new Error("Assets not loaded yet!");

    return this.textures[name];
  }

  static getAnimations(): THREE.AnimationClip[] {
    if (!this.is_loaded) throw new Error("Assets not loaded yet!");
    
    return this.gltf.animations;
  }
}
