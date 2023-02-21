import { ElementRef, Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let camera, scene, renderer, startTime, object;

function animate() {
  const currentTime = Date.now();
  const time = (currentTime - startTime) / 1000;

  requestAnimationFrame(animate);

  object.position.y = 0.8;
  object.rotation.x = time * 0.5;
  object.rotation.y = time * 0.2;
  object.scale.setScalar(Math.cos(time) * 0.125 + 0.875);

  renderer.render(scene, camera);
}

@Injectable({
  providedIn: 'root',
})
export class StencilSceneService2 {
  init(container: ElementRef) {
    camera = new THREE.PerspectiveCamera(
      36,
      container.nativeElement.clientWidth / container.nativeElement.clientHeight,
      0.25,
      16
    );

    camera.position.set(0, 1.3, 3);

    scene = new THREE.Scene();

    // Lights

    scene.add(new THREE.AmbientLight(0x505050));

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    const dirLight = new THREE.DirectionalLight(0x55505a, 1);
    dirLight.position.set(0, 3, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 10;

    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.left = -1;
    dirLight.shadow.camera.top = 1;
    dirLight.shadow.camera.bottom = -1;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // ***** Clipping planes: *****

    const localPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.8);
    const globalPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.1);

    // Geometry

    const material = new THREE.MeshPhongMaterial({
      color: 0x80ee10,
      shininess: 100,
      side: THREE.DoubleSide,

      // ***** Clipping setup (material): *****
      clippingPlanes: [localPlane],
      clipShadows: true,
    });

    const geometry = new THREE.TorusKnotGeometry(0.4, 0.08, 95, 20);

    object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    scene.add(object);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0xa0adaf, shininess: 150 })
    );

    ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
    ground.receiveShadow = true;
    scene.add(ground);

    // Renderer

    renderer = new THREE.WebGLRenderer({
      canvas: container.nativeElement
    });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
      container.nativeElement.clientWidth,
      container.nativeElement.clientHeight
    );
    // window.addEventListener( 'resize', onWindowResize );
    // container.nativeElement.appendChild(renderer.domElement);

    // ***** Clipping setup (renderer): *****
    const globalPlanes = [globalPlane],
      Empty = Object.freeze([]);
    renderer.clippingPlanes = Empty; // GUI sets it to globalPlanes
    renderer.localClippingEnabled = true;

    // Controls

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();

    startTime = Date.now();
  }

  animate(){
    animate();
  }
}
