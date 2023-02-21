import { HttpClient } from '@angular/common/http';
import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as THREE from 'three';
import {
  AmbientLight,
  AxesHelper,
  Camera,
  DirectionalLight,
  EdgesGeometry,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshPhongMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three';
import { getWireFrameElementTypes } from './wireframe-elements';

let LINES_MATERIAL = new MeshPhongMaterial({
  color: 0xff0000,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
  opacity: 0,
  transparent: true
});

let LINES_MATERIAL2 = new LineBasicMaterial({ color: 'black' })

@Injectable({
  providedIn: 'root',
})
export class IfcService {
  public scene: Scene;
  public camera: PerspectiveCamera;
  public controls: OrbitControls;
  private animateFn: FrameRequestCallback;
  private renderer: WebGLRenderer;
  private ifcLoader: IFCLoader;

  public models: any[] = [];
  private subsets: any[] = [];
  private isTransparent: boolean = false;

  private cameraPosition = new BehaviorSubject<Vector3>(new Vector3(0, 0, 0));
  cameraPosition$ = this.cameraPosition.asObservable();
  private dist = new BehaviorSubject<number>(null);
  dist$ = this.dist.asObservable();

  constructor(private http: HttpClient){}

  initScene(container: ElementRef) {
    this.scene = new Scene();
    const grid = new GridHelper(50, 30);
    this.scene.add(grid);

    // const aspectRatio =
    //   container.nativeElement.width / container.nativeElement.height;
    // this.camera = new OrthographicCamera(
    //   (-aspectRatio * 10) / 2,
    //   (aspectRatio * 10) / 2,
    //   10 / 2,
    //   -10 / 2,
    //   -1000,
    //   1000
    // );

    this.camera = new PerspectiveCamera(75, 1);
    this.camera.position.z = 15;
    this.camera.position.y = 13;
    this.camera.position.x = 8;
    this.controls = new OrbitControls(this.camera, container.nativeElement);
    this.controls.enableDamping = false;
    this.controls.target.set(-2, 0, 0);

    const lightColor = 0xffffff;
    const ambientLight = new AmbientLight(lightColor, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(lightColor, 1);
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);

    this.controls.addEventListener('change', () => {
      directionalLight.position.copy(this.camera.position);
    });

    this.renderer = new WebGLRenderer({
      canvas: container.nativeElement,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.localClippingEnabled = true;

    const rect = container.nativeElement.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height - 18); //leave some padding on the bottom so we don't show an annoying scroll bar
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.animateFn = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.animateFn);
    };

    
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const materials = [
    //   new THREE.MeshPhongMaterial({ color: 'blue' }),
    //   new THREE.MeshPhongMaterial({ color: 'red' }),
    //   new THREE.MeshPhongMaterial({ color: 'green' }),
    //   new THREE.MeshPhongMaterial({ color: 'yellow' }),
    //   new THREE.MeshPhongMaterial({ color: 'orange' }),
    //   new THREE.MeshPhongMaterial({ color: 'black' }),
    // ];

    // const cube = new THREE.Mesh(geometry, materials);
    // this.camera.add(cube);
    // cube.position.set(0, 0, 0);
    // cube.position.set(-9, 0, -0.1);
    // cube.quaternion.copy(this.camera.quaternion);
    // cube.rotation.copy(this.camera.rotation);
    // this.scene.add(this.camera);

    // this.controls.addEventListener('change', () => {
    //   this.cameraPosition.next(this.camera.position);
    //   cube.quaternion.copy(this.camera.quaternion);
    //   cube.quaternion.copy(cube.quaternion.invert());
    //   cube.rotation.copy(this.camera.rotation);

    //   this.dist.next(this.camera.position.distanceTo(cube.position));
      
    //   // this.camera.getWorldDirection(newAxesPosition);
    //   // newAxesPosition.multiplyScalar(.5);
    //   // newAxesPosition.add(this.camera.position);
    //   // cube.position.copy(newAxesPosition);
    // });
  }

  animate() {
    this.animateFn(1);
  }

  initIfc() {
    this.ifcLoader = new IFCLoader();
    this.ifcLoader.ifcManager.applyWebIfcConfig({
      USE_FAST_BOOLS: false,
      COORDINATE_TO_ORIGIN: false,
    });
    this.ifcLoader.ifcManager.setWasmPath('assets/');
  }

  loadAsset(url: string){
    this.http.get(url, {responseType: 'blob'}).subscribe(blob => {
      const ifcUrl = window.URL.createObjectURL(blob);
      this.loadIfcFile(ifcUrl);
    });
  }

  async loadIfcFile(fileUrl: any) {
    this.ifcLoader.load(fileUrl, async (ifcModel: any) => {
      //This will will make everything transparent, but no subsets
      // (ifcModel.material as Material[]).forEach(m => {
      //   m.opacity = .5;
      //   m.transparent = true;
      // });
      this.models.push(ifcModel);
      // this.scene.add(ifcModel);

      //get all ids in the model
      const allIds = this.getIdsFromSubset(ifcModel);
      this.createSubset(0, allIds, 'everything_else', false);

      //get only the ids of things within a constrained set (wall, beam, etc)
      //create a subset with edge lines
      const wireframeIds = await this.getWireframeElements(0);
      this.createSubset(0, wireframeIds, 'wireframe_elements', true);

      this.centerOnSubset('everything_else');
    });
  }

  getIdsFromSubset(subset: any) {
    // const indices = Array.from(new Set(Array.from(subset.geometry.index.array)));
    // const indices = Uint32Array.from(new Set(Uint32Array.from(subset.geometry.index.array)));
    const indices = subset.geometry.index.array;
    const ids = new Set();
    for (let index of indices) {
      ids.add(subset.geometry.attributes.expressID.getX(index));
    }
    return Array.from(ids).map((id: any) => +id);
  }

  createLines(geometry: any) {
    var mesh = new Mesh(geometry, LINES_MATERIAL);

    const edges = new EdgesGeometry(geometry);
    const line = new LineSegments(
      edges,
      LINES_MATERIAL2
    );
    mesh.add(line);
    return mesh;
  }

  async getWireframeElements(modelId: number) {
    const promises = [];
    getWireFrameElementTypes().forEach((ifcTypeId: number) => {
      promises.push(
        this.ifcLoader.ifcManager.getAllItemsOfType(modelId, ifcTypeId, false)
      );
    });

    let elementIds = [];
    await Promise.all(promises).then((elementIdsList) => {
      elementIds = elementIdsList.flat();
    });
    return elementIds;
  }

  createSubset(
    modelID: number,
    expressIds: number[],
    customId: string,
    wireframe: boolean = false
  ) {
    //if these ids are part of another subset, remove them
    // this.removeIdsFromSubset(modelID, expressIds);

    const subset = this.ifcLoader.ifcManager.createSubset({
      modelID: modelID,
      ids: expressIds,
      scene: this.scene,
      removePrevious: true,
      customID: customId,
    });

    let lines: any = null;
    if (wireframe) {
      lines = this.createLines(subset.geometry);
      subset.add(lines);
      // this.scene.add(lines);
    }

    this.subsets.push({
      subsetId: customId,
      lines: lines,
    });
  }

  removeIdsFromSubset(modelID: number, expressIds: number[]) {
    this.subsets.forEach((s) => {
      this.ifcLoader.ifcManager.removeFromSubset(
        modelID,
        expressIds,
        s.subsetId
      );
    });
  }

  toggleTransparency() {
    this.isTransparent = !this.isTransparent;

    // this.models.forEach(model => {
    //   model.material.forEach(material => {
    //     material.opacity = .5;
    //     material.transparent = true;
    //   });
    // });

    for (let item in this.ifcLoader.ifcManager.subsets.items) {
      console.log(item);
    }

    this.subsets.forEach((s) => {
      if (s.lines) {
        // this.scene.remove(s.lines);
      }
      const subset = this.ifcLoader.ifcManager.getSubset(0, null, s.subsetId);
      if (s.lines) {
        if (this.isTransparent) {
          s.lines.transparent = true;
          s.lines.opacity = 0.5;
        } else {
          s.lines.transparent = false;
          s.lines.opacity = 1;
        }
      }

      (subset.material as Material[]).forEach((m) => {
        if (this.isTransparent) {
          m.opacity = 0.5;
          m.transparent = true;
        } else {
          m.opacity = 1;
          m.transparent = false;
        }
      });
    });
  }

  getCenter(subset: any): Vector3 {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (let i in subset.geometry.index.array) {
        const position = subset.geometry.index.array[i];

        const x =
        subset.geometry.attributes['position'].getX(position);
        const y =
        subset.geometry.attributes['position'].getY(position);
        const z =
        subset.geometry.attributes['position'].getZ(position);

        if (x > maxX) {
          maxX = x;
        }
        if (x < minX) {
          minX = x;
        }

        if (y > maxY) {
          maxY = y;
        }
        if (y < minY) {
          minY = y;
        }

        if (z > maxZ) {
          maxZ = z;
        }
        if (z < minZ) {
          minZ = z;
        }
      }

      let middle = new THREE.Vector3();
      let geometry = subset.geometry;
      geometry.computeBoundingBox();
      middle.x = (maxX + minX) / 2;
      middle.y = (maxY + minY) / 2;
      middle.z = (maxZ + minZ) / 2;
      subset.localToWorld(middle);

      return middle;
  }

  centerOnSubset(subsetName: string, material?: Material) {
    const selectedElementsSubset = this.ifcLoader.ifcManager.getSubset(
      0,
      material,
      subsetName
    );

    if (selectedElementsSubset) {
      let middle = this.getCenter(selectedElementsSubset);      
      this.controls.target.set(middle.x, middle.y, middle.z);
      this.camera.lookAt(middle.x, middle.y, middle.z);
    }
  }

  getMaxDimension(){
    var cube_bbox = new THREE.Box3();
    cube_bbox.setFromObject( this.models[0] );
    const cube_height = cube_bbox.max.y - cube_bbox.min.y;
    return cube_height;
  }

  addPlane(invert: boolean) {
    const center = this.getCenter(this.models[0]);
    const size = this.getMaxDimension();

    const ret = invert ? center.x : -1 * center.x;
    
    //TODO: is this on the X, Y or Z plane?
    const posX = invert ? -1 : 1;
    const localPlane = new THREE.Plane(new THREE.Vector3(posX, 0, 0), -center.x);
    const helper = new THREE.PlaneHelper( localPlane, 25, 0xFF0000 );  //todo: how to get size of model and center the plane on the model?
    this.scene.add(helper);

    this.models[0].material.forEach((m: Material) => {
      if(!m.clippingPlanes){
        m.clippingPlanes = [localPlane];
      } else {
        m.clippingPlanes.push(localPlane);
      }
    });
    
    if(LINES_MATERIAL2.clippingPlanes) {
      LINES_MATERIAL2.clippingPlanes.push(localPlane);
    } else {
      LINES_MATERIAL2.clippingPlanes = [localPlane];
    }

    //todo: X, Y or Z?
    return -center.x;
  }

  adjustPlane(planeIdx: number, newConstant: number){
    this.models[0].material.forEach((m: Material) => {
      m.clippingPlanes[planeIdx].constant = newConstant;
    });
  }

  flipPlane(planeIdx: number, invert: boolean){
    //todo: need to know if we're inverting X, Y or Z
    let done = false;
    this.models[0].material.forEach((m: Material) => {
      if(!done){
        const v: Vector3 = m.clippingPlanes[planeIdx].normal;
        let newX = v.x;
        if(invert){
          newX = v.x * -1;
        } else {
          newX = Math.abs(v.x);
        }
        m.clippingPlanes[planeIdx].normal.setX(newX);
        done = true;
      }
    });
  }
}
