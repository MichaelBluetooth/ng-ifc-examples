import * as THREE from 'three';
import {
  AlwaysStencilFunc,
  BackSide,
  DecrementWrapStencilOp,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NotEqualStencilFunc,
  Plane,
  PlaneGeometry,
  Renderer,
  ReplaceStencilOp,
  Scene,
} from 'three';

function createPlaneStencilGroup(
  geometry: any,
  plane: Plane,
  renderOrder: number
) {
  const group = new Group();
  const baseMat = new MeshBasicMaterial();
  baseMat.depthWrite = false;
  baseMat.depthTest = false;
  baseMat.colorWrite = false;
  baseMat.stencilWrite = true;
  baseMat.stencilFunc = AlwaysStencilFunc;

  // back faces
  const mat0 = baseMat.clone();
  mat0.side = BackSide;
  mat0.clippingPlanes = [plane];
  mat0.stencilFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZPass = THREE.IncrementWrapStencilOp;

  const mesh0 = new THREE.Mesh(geometry, mat0);
  mesh0.renderOrder = renderOrder;
  group.add(mesh0);

  // front faces
  const mat1 = baseMat.clone();
  mat1.side = FrontSide;
  mat1.clippingPlanes = [plane];
  mat1.stencilFail = DecrementWrapStencilOp;
  mat1.stencilZFail = DecrementWrapStencilOp;
  mat1.stencilZPass = DecrementWrapStencilOp;

  const mesh1 = new Mesh(geometry, mat1);
  mesh1.renderOrder = renderOrder;

  group.add(mesh1);

  return group;
}

function applyStencil(
  geometry: any,
  object: Group,
  planeGeom: PlaneGeometry,
  planeObjects: any[],
  plane: Plane,
  order: number,
  otherPlanes: Plane[],
  scene: Scene
) {
  const poGroup = new THREE.Group();
  const stencilGroup = createPlaneStencilGroup(geometry, plane, order);

  const planeMat = new THREE.MeshStandardMaterial({
    color: 0xe91e63,
    metalness: 0.1,
    roughness: 0.75,
    clippingPlanes: otherPlanes,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  });
  const po = new THREE.Mesh(planeGeom, planeMat);
  po.onAfterRender = function (renderer) {
    renderer.clearStencil();
  };

  po.renderOrder = order + 1.1;
  object.add(stencilGroup);
  poGroup.add(po);
  planeObjects.push(po);
  scene.add(poGroup);
}

export { createPlaneStencilGroup, applyStencil };
