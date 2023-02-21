import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { Plane, PlaneGeometry, PlaneHelper, Vector3 } from 'three';
import { IfcService } from '../ifc.service';
import { IfcPlane } from './ifc-plane';

@Component({
  selector: 'app-planes-controller',
  templateUrl: './planes-controller.component.html',
  styleUrls: ['./planes-controller.component.less'],
})
export class PlanesControllerComponent implements OnInit {
  selectedPlane: IfcPlane;
  planes = [];

  constructor(private ifc: IfcService) {}

  ngOnInit(): void {    
  }

  addPlane() {
    this.planes.push({
      name: `Plane ${this.planes.length + 1}`,
      constant: 5,
      invert: false
    });
    this.selectedPlane = this.planes[this.planes.length - 1];

    this.ifc.addPlane(this.selectedPlane.constant, this.selectedPlane.invert);

    // this.initThreeJSPlanes();
  }

  planeConstantChanged() {
    const idx = this.planes.findIndex(p => p.name === this.selectedPlane.name);
    this.ifc.adjustPlane(idx, this.selectedPlane.constant);
  }

  planeInvertChange(){
    const idx = this.planes.findIndex(p => p.name === this.selectedPlane.name);
    this.ifc.flipPlane(idx, this.selectedPlane.invert);
  }

  // initThreeJSPlanes() {
  //   const planes = [
  //     new Plane(new Vector3(-1, 0, 0), 0),
  //     // new Plane(new Vector3(0, -1, 0), 0),
  //     // new Plane(new Vector3(0, 0, -1), 0),
  //   ];
  //   this.ifc.planes[0].offset = planes[0].constant;
  //   this.ifc.planes[this.ifc.planes.length - 1].plane = planes[0];

  //   const planeHelpers = planes.map((p) => new PlaneHelper(p, 50, 0x880808)); //white; 0xffffff
  //   planeHelpers.forEach((ph) => {
  //     ph.visible = true;
  //     this.ifc.scene.add(ph);
  //   });

  //   // Set up clip plane rendering
  //   const planeGeom = new PlaneGeometry(4, 4);

  //   for (let i = 0; i < planes.length; i++) {
  //     const poGroup = new THREE.Group();
  //     const plane = planes[i];
  //     const stencilGroup = this.createPlaneStencilGroup(
  //       this.ifc.models[0],
  //       plane,
  //       i + 1
  //     );

  //     // plane is clipped by the other clipping planes
  //     const planeMat = new THREE.MeshStandardMaterial({
  //       color: 0xe91e63,
  //       metalness: 0.1,
  //       roughness: 0.75,
  //       clippingPlanes: planes.filter((p) => p !== plane),

  //       stencilWrite: true,
  //       stencilRef: 0,
  //       stencilFunc: THREE.NotEqualStencilFunc,
  //       stencilFail: THREE.ReplaceStencilOp,
  //       stencilZFail: THREE.ReplaceStencilOp,
  //       stencilZPass: THREE.ReplaceStencilOp,
  //     });
  //     const po = new THREE.Mesh(planeGeom, planeMat);
  //     po.onAfterRender = function (renderer) {
  //       renderer.clearStencil();
  //     };

  //     po.renderOrder = i + 1.1;

  //     this.ifc.models[0].add(stencilGroup);
  //     poGroup.add(po);
  //     this.ifc.planeObjects.push(po);
  //     this.ifc.scene.add(poGroup);
  //   }

  //   const material = new THREE.MeshStandardMaterial({
  //     color: 0xffc107,
  //     metalness: 0.1,
  //     roughness: 0.75,
  //     clippingPlanes: planes,
  //     clipShadows: true,
  //     shadowSide: THREE.DoubleSide,
  //   });

  //   // add the color
  //   const clippedColorFront = new THREE.Mesh(this.ifc.models[0], material);
  //   clippedColorFront.castShadow = true;
  //   clippedColorFront.renderOrder = 6;
  //   this.ifc.models[0].add(clippedColorFront);
  // }

  // createPlaneStencilGroup(geometry, plane, renderOrder) {
  //   const group = new THREE.Group();
  //   const baseMat = new THREE.MeshBasicMaterial();
  //   baseMat.depthWrite = false;
  //   baseMat.depthTest = false;
  //   baseMat.colorWrite = false;
  //   baseMat.stencilWrite = true;
  //   baseMat.stencilFunc = THREE.AlwaysStencilFunc;

  //   // back faces
  //   const mat0 = baseMat.clone();
  //   mat0.side = THREE.BackSide;
  //   mat0.clippingPlanes = [plane];
  //   mat0.stencilFail = THREE.IncrementWrapStencilOp;
  //   mat0.stencilZFail = THREE.IncrementWrapStencilOp;
  //   mat0.stencilZPass = THREE.IncrementWrapStencilOp;

  //   const mesh0 = new THREE.Mesh(geometry, mat0);
  //   mesh0.renderOrder = renderOrder;
  //   group.add(mesh0);

  //   // front faces
  //   const mat1 = baseMat.clone();
  //   mat1.side = THREE.FrontSide;
  //   mat1.clippingPlanes = [plane];
  //   mat1.stencilFail = THREE.DecrementWrapStencilOp;
  //   mat1.stencilZFail = THREE.DecrementWrapStencilOp;
  //   mat1.stencilZPass = THREE.DecrementWrapStencilOp;

  //   const mesh1 = new THREE.Mesh(geometry, mat1);
  //   mesh1.renderOrder = renderOrder;

  //   group.add(mesh1);

  //   return group;
  // }
}
