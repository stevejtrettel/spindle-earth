import * as THREE from 'three';

/**
 * Build THREE.js BufferGeometry from a parametric surface
 *
 * Samples the surface on a regular grid in parameter space and creates
 * a triangulated mesh. Automatically uses analytical normals if the
 * surface provides them.
 *
 * @param {Object} surface - The parametric surface (must have evaluate and getDomain methods)
 * @param {Object} [options]
 * @param {number} [options.uMin] - Minimum u parameter (overrides surface domain)
 * @param {number} [options.uMax] - Maximum u parameter (overrides surface domain)
 * @param {number} [options.vMin] - Minimum v parameter (overrides surface domain)
 * @param {number} [options.vMax] - Maximum v parameter (overrides surface domain)
 * @param {number} [options.uSegments=32] - Number of segments in u direction
 * @param {number} [options.vSegments=32] - Number of segments in v direction
 * @returns {THREE.BufferGeometry}
 *
 * @example
 *   const geometry = buildGeometry(surface, {
 *     uSegments: 64,
 *     vSegments: 64
 *   });
 *   const mesh = new THREE.Mesh(geometry, material);
 */
export function buildGeometry(surface, options = {}) {
  // Extract domain bounds with option overrides
  const domain = surface.getDomain();
  const uMin = options.uMin ?? domain.uMin;
  const uMax = options.uMax ?? domain.uMax;
  const vMin = options.vMin ?? domain.vMin;
  const vMax = options.vMax ?? domain.vMax;
  const uSegments = options.uSegments ?? 32;
  const vSegments = options.vSegments ?? 32;

  // Check if surface has analytical normals
  const hasNormals = 'computeNormal' in surface;

  // Allocate arrays for vertex data
  const positions = [];
  const normals = [];
  const uvs = [];

  // Generate vertices on a regular grid
  for (let i = 0; i <= vSegments; i++) {
    const v = vMin + (vMax - vMin) * (i / vSegments);

    for (let j = 0; j <= uSegments; j++) {
      const u = uMin + (uMax - uMin) * (j / uSegments);

      // Evaluate surface at (u, v)
      const point = surface.evaluate(u, v);
      positions.push(point.x, point.y, point.z);

      // Compute normal if surface supports it
      if (hasNormals) {
        const normal = surface.computeNormal(u, v);
        normals.push(normal.x, normal.y, normal.z);
      }

      // UV texture coordinates (normalized to [0,1])
      uvs.push(j / uSegments, i / vSegments);
    }
  }

  // Generate triangle indices from quad grid
  const indices = [];

  for (let i = 0; i < vSegments; i++) {
    for (let j = 0; j < uSegments; j++) {
      // Vertices of current quad
      const v0 = i * (uSegments + 1) + j;           // Bottom-left
      const v1 = (i + 1) * (uSegments + 1) + j;     // Top-left
      const v2 = i * (uSegments + 1) + (j + 1);     // Bottom-right
      const v3 = (i + 1) * (uSegments + 1) + (j + 1); // Top-right

      // Two triangles per quad
      // Winding consistent with normal = du × dv (outward)
      indices.push(v0, v2, v1);
      indices.push(v1, v2, v3);
    }
  }

  // Create BufferGeometry
  const geometry = new THREE.BufferGeometry();

  // Set attributes
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  // Handle normals
  if (normals.length > 0) {
    // Use analytical normals from surface
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  } else {
    // Fall back to computed vertex normals
    geometry.computeVertexNormals();
  }

  return geometry;
}
