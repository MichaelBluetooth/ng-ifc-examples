import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanesControllerComponent } from './planes-controller.component';

describe('PlanesControllerComponent', () => {
  let component: PlanesControllerComponent;
  let fixture: ComponentFixture<PlanesControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanesControllerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanesControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
