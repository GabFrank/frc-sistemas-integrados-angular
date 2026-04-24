import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainCajaObservacionComponent } from './main-caja-observacion.component';

describe('MainCajaObservacionComponent', () => {
  let component: MainCajaObservacionComponent;
  let fixture: ComponentFixture<MainCajaObservacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainCajaObservacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainCajaObservacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
