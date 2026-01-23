import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutaHojaComponent } from './ruta-hoja.component';

describe('RutaHojaComponent', () => {
  let component: RutaHojaComponent;
  let fixture: ComponentFixture<RutaHojaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RutaHojaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RutaHojaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
