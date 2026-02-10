/**
 * SurfaceMesh
 *
 * A THREE.Mesh that wraps a parametric surface with automatic geometry
 * tessellation and optional custom shaders via CustomShaderMaterial.
 */

import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { buildGeometry } from './buildGeometry.js';

export class SurfaceMesh extends THREE.Mesh {

  constructor(surface, options = {}) {
    super();
    this.surface = surface;
    this.uSegments = options.uSegments ?? 32;
    this.vSegments = options.vSegments ?? 32;

    /** Shader uniforms — mutate .value properties to animate. */
    this.uniforms = options.uniforms ?? {};

    // Create material: CSM if shaders provided, plain MeshPhysicalMaterial otherwise
    if (options.fragmentShader || options.vertexShader) {
      // A 1x1 white texture assigned as `map` forces Three.js to enable the UV
      // pipeline (USE_UV, vUv varying). The white color has no visual effect.
      const uvEnableTexture = new THREE.DataTexture(
        new Uint8Array([255, 255, 255, 255]), 1, 1
      );
      uvEnableTexture.needsUpdate = true;

      this.material = new CustomShaderMaterial({
        baseMaterial: THREE.MeshPhysicalMaterial,
        vertexShader: options.vertexShader,
        fragmentShader: options.fragmentShader,
        uniforms: this.uniforms,
        side: THREE.DoubleSide,
        map: uvEnableTexture,
      });
    } else {
      this.material = new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
      });
    }

    // Apply material properties
    const mat = this.material;
    mat.color.set(options.color ?? 0x4488ff);
    mat.roughness = options.roughness ?? 0.3;
    mat.metalness = options.metalness ?? 0.1;
    mat.wireframe = options.wireframe ?? false;

    // Initial geometry build
    this.rebuild();
  }

  /** Rebuild geometry from the surface. Call after changing the surface shape. */
  rebuild() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    this.geometry = buildGeometry(this.surface, {
      uSegments: this.uSegments,
      vSegments: this.vSegments,
    });
  }

  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}
