import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Vector2, Vector3 } from 'three';
import { IfcService } from './ifc.service';
import { StencilSceneService } from './stencil-scene.service';
import { StencilSceneService2 } from './stencil-scene2.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('threeCanvas', { static: true }) canvas: ElementRef;
  @ViewChild('uploadField', { static: true }) uploadField: ElementRef;

  cameraPosition$ = this.ifc.cameraPosition$;
  dist$ = this.ifc.dist$;

  constructor(private ifc: IfcService, private stencil: StencilSceneService2) {}

  ngAfterViewInit() {
    // this.stencil.init(this.canvas);
    // this.stencil.animate();

    this.ifc.initScene(this.canvas);
    this.ifc.animate();
    this.ifc.initIfc();
    setTimeout(() => {
      this.ifc.loadAsset('assets/less_simple.ifc');
    }, 500);
  }

  loadIfcFile(evt: any): void {
    if (evt.target.files.length > 0) {
      const fileUrl = URL.createObjectURL(evt.target.files[0]);
      this.ifc.loadIfcFile(fileUrl);
    }
  }

  toggleTransparency() {
    this.ifc.toggleTransparency();
  }


  vec = new Vector3(); // create once and reuse
  pos = new Vector3(); // create once and reuse
  @HostListener('document:mousedown', ['$event'])
  onMouseMove(event) {

    // this.vec.set(
    //   (event.clientX / window.innerWidth) * 2 - 1,
    //   -(event.clientY / window.innerHeight) * 2 + 1,
    //   0.5
    // );

    // this.vec.unproject(this.ifc.camera);
    // this.vec.sub(this.ifc.camera.position).normalize();
    // var distance = -this.ifc.camera.position.z / this.vec.z;
    // this.pos.copy(this.ifc.camera.position).add(this.vec.multiplyScalar(distance));
  }

  setZoomSpeed(){
    // this.ifc.controls.zoomSpeed = this.zoomSpeed;
  }

  dist: number = Infinity;
  zoomSpeed: number = 1;
  @HostListener('mousewheel', ['$event'])
  zoom(e: WheelEvent) {
    // this.ifc.camera.getWorldDirection(this.pos);
    // this.pos.multiplyScalar(10);
    // this.pos.add(this.ifc.camera.position);    
    // this.ifc.controls.target.set(this.pos.x, this.pos.y, this.pos.z);
    // this.dist = this.ifc.camera.position.distanceTo(this.ifc.controls.target);    
  }
}
