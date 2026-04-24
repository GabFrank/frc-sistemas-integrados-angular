import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainVentaObservacionComponent } from './main-venta-observacion.component';

describe('MainVentaObservacionComponent', () => {
  let component: MainVentaObservacionComponent;
  let fixture: ComponentFixture<MainVentaObservacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainVentaObservacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainVentaObservacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
