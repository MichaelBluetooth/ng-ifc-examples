import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { IfcService } from './ifc.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('threeCanvas', { static: true }) canvas: ElementRef;
  @ViewChild('uploadField', { static: true }) uploadField: ElementRef;

  constructor(private ifc: IfcService) {}

  ngAfterViewInit() {
    this.ifc.initScene(this.canvas);
    this.ifc.animate();
    this.ifc.initIfc();
  }

  loadIfcFile(evt: any): void {
    if (evt.target.files.length > 0) {
      const fileUrl = URL.createObjectURL(evt.target.files[0]);
      this.ifc.loadIfcFile(fileUrl);
    }
  }

  toggleTransparency(){
    this.ifc.toggleTransparency();
  }
}
