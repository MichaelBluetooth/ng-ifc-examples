import { ElementRef, Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let camera, scene, renderer, object;
let planes, planeObjects, planeHelpers;

const params = {
  animate: true,
  planeX: {
    constant: 0,
    negated: false,
    displayHelper: false,
  },
  planeY: {
    constant: 0,
    negated: false,
    displayHelper: false,
  },
  planeZ: {
    constant: 0,
    negated: false,
    displayHelper: false,
  },
};

@Injectable({
  providedIn: 'root',
})
export class StencilSceneService {
  init(container: ElementRef) {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      36,
      window.innerWidth / window.innerHeight,
      1,
      100
    );
    camera.position.set(2, 2, 2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    planes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    //   new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    ];

    planeHelpers = planes.map((p) => new THREE.PlaneHelper(p, 2, 0xffffff));
    planeHelpers.forEach((ph) => {
      ph.visible = true;
      scene.add(ph);
    });

    const geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 220, 60);
    object = new THREE.Group();
    scene.add(object);

    // Set up clip plane rendering
    planeObjects = [];
    const planeGeom = new THREE.PlaneGeometry(4, 4);

    for (let i = 0; i < planes.length; i++) {
      const poGroup = new THREE.Group();
      const plane = planes[i];
      const stencilGroup = this.createPlaneStencilGroup(geometry, plane, i + 1);

      // plane is clipped by the other clipping planes
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0xe91e63,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes.filter((p) => p !== plane),

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

      po.renderOrder = i + 1.1;

      object.add(stencilGroup);
      poGroup.add(po);
      planeObjects.push(po);
      scene.add(poGroup);
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xffc107,
      metalness: 0.1,
      roughness: 0.75,
      clippingPlanes: planes,
      clipShadows: true,
      shadowSide: THREE.DoubleSide,
    });

    // add the color
    const clippedColorFront = new THREE.Mesh(geometry, material);
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    object.add(clippedColorFront);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9, 1, 1),
      new THREE.ShadowMaterial({
        color: 0x000000,
        opacity: 0.25,
        side: THREE.DoubleSide,
      })
    );

    ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: container.nativeElement,
      alpha: true,
    });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x263238);
    document.body.appendChild(renderer.domElement);

    renderer.localClippingEnabled = true;

    // Controls
    const controls = new OrbitControls(camera, container.nativeElement);
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.update();
  }

  createPlaneStencilGroup(geometry, plane, renderOrder) {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    // back faces
    const mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [plane];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    const mesh0 = new THREE.Mesh(geometry, mat0);
    mesh0.renderOrder = renderOrder;
    group.add(mesh0);

    // front faces
    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [plane];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh(geometry, mat1);
    mesh1.renderOrder = renderOrder;

    group.add(mesh1);

    return group;
  }

  animate() {

    requestAnimationFrame(() => {
        this.animate();
    });

    for (let i = 0; i < planeObjects.length; i++) {
      const plane = planes[i];
      const po = planeObjects[i];
      plane.coplanarPoint(po.position);
      po.lookAt(
        po.position.x - plane.normal.x,
        po.position.y - plane.normal.y,
        po.position.z - plane.normal.z
      );
    }

    renderer.render(scene, camera);
  }
}
