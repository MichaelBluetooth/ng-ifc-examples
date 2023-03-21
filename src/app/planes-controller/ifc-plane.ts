import { Plane } from "three";

export interface IfcPlane {
    name: string;
    constant: number;
    invert: boolean;
    showHelper: boolean;
    //x, y or z?
}