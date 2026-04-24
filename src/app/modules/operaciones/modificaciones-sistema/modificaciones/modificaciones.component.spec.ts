import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificacionesComponent } from './modificaciones.component';

describe('ModificacionesComponent', () => {
  let component: ModificacionesComponent;
  let fixture: ComponentFixture<ModificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificacionesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
