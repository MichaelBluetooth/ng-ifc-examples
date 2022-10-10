import { ElementRef, Injectable } from '@angular/core';
import {
  AmbientLight,
  Camera,
  DirectionalLight,
  EdgesGeometry,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three';
import { getWireFrameElementTypes } from './wireframe-elements';

@Injectable({
  providedIn: 'root',
})
export class IfcService {
  private scene: Scene;
  private camera: Camera;
  private controls: OrbitControls;
  private animateFn: FrameRequestCallback;
  private renderer: WebGLRenderer;
  private ifcLoader: IFCLoader;

  private subsets: any[] = [];
  private isTransparent: boolean = false;

  initScene(container: ElementRef) {
    this.scene = new Scene();
    const grid = new GridHelper(50, 30);
    this.scene.add(grid);

    this.camera = new PerspectiveCamera(75, 1);
    this.camera.position.z = 15;
    this.camera.position.y = 13;
    this.camera.position.x = 8;
    this.controls = new OrbitControls(this.camera, container.nativeElement);
    this.controls.enableDamping = true;
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

    const rect = container.nativeElement.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height - 18); //leave some padding on the bottom so we don't show an annoying scroll bar
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.animateFn = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.animateFn);
    };
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

  async loadIfcFile(fileUrl: any) {
    this.ifcLoader.load(fileUrl, async (ifcModel: any) => {
      //This will will make everything transparent, but no subsets
      /*(ifcModel.material as Material[]).forEach(m => {
        m.opacity = .5;
        m.transparent = true;
      });
      this.scene.add(ifcModel);*/


      //get all ids in the model
      const allIds = this.getIdsFromSubset(ifcModel);

      //get only the ids of things within a constrained set (wall, beam, etc)
      //create a subset with edge lines
      const wireframeIds = await this.getWireframeElements(0);
      this.createSubset(0, wireframeIds, 'wireframe_elements', true);
      
      //for any remaining elements, create another subset without edge lines
      const allNonWireframeIds = allIds.filter(id => {
        return !wireframeIds.includes(id);
      });
      this.createSubset(0, allNonWireframeIds, 'everything_else', false);
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
    let material = new MeshPhongMaterial({
      color: 0xff0000,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    var mesh = new Mesh(geometry, material);

    const edges = new EdgesGeometry(geometry);
    const line = new LineSegments(
      edges,
      new LineBasicMaterial({ color: 'black' })
    );
    mesh.add(line);
    return mesh;
  }

  async getWireframeElements(modelId: number){
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
    this.removeIdsFromSubset(modelID, expressIds);

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
      this.scene.add(lines);
    }

    this.subsets.push({
      subsetId: customId,
      lines: lines,
    });
  }

  removeIdsFromSubset(modelID: number, expressIds: number[]) {
    this.subsets.forEach(s => {
        this.ifcLoader.ifcManager.removeFromSubset(modelID, expressIds, s.subsetId);
    });
  }

  toggleTransparency() {
    this.isTransparent = !this.isTransparent;

    this.subsets.forEach((s) => {
      const subset = this.ifcLoader.ifcManager.getSubset(0, null, s.subsetId);
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
}
