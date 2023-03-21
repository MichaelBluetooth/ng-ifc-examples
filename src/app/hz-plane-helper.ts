import {
    BoxGeometry,
    Line,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Plane,
    PlaneHelper,
    Scene,
    Vector3,
  } from 'three';
  
  class HzPlaneHelper extends PlaneHelper {
    static matrix = new Matrix4();
    private invert: boolean = false;
  
    constructor(invert: boolean, plane: Plane, size?: number, hex?: number){
      super(plane, size, hex);
      this.invert = invert;
    }
  
    override updateMatrixWorld(force) {
      this.position.set(0, 0, 0);
      this.scale.set(0.5 * this.size, 0.5 * this.size, 1);
  
      //swap this.plane.normal and this.position if this helper is facing wrong dir
      if(this.invert){
        this.matrix.lookAt(this.plane.normal, this.position, this.up);
      } else {
        this.matrix.lookAt(this.position, this.plane.normal, this.up);
      }
      this.quaternion.setFromRotationMatrix(this.matrix);
      this.translateZ(-1);
  
      // this.translateZ(-this.plane.constant);
      Line.prototype.updateMatrixWorld.call(this, force);
    }
  
    flip(invert: boolean) {
      if (invert) {
        this.matrix.lookAt(this.plane.normal, this.position, this.up);
      } else {
        this.matrix.lookAt(this.position, this.plane.normal, this.up);      
      }
    }
  }
  
  function buildPlaneHelper(
    scene: Scene,
    center: Vector3,
    size: number,
    localPlane: Plane,
    invert: boolean = false
  ) {
    const dir = new Vector3();
    dir.subVectors(center, new Vector3(0, 0, 0));
    localPlane.translate(dir);
  
    const helper = new HzPlaneHelper(invert, localPlane, size * 2, 0x0000ff);
    scene.add(helper);
  
    const centerBox = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: 'black', visible: true }) //set visible to "true" to show a little box where the center is for debugging
    );
    centerBox.add(helper);
    centerBox.position.copy(center);
  
    scene.add(centerBox);
  
    return { helper, centerBox };
  }
  
  export { HzPlaneHelper, buildPlaneHelper };
  