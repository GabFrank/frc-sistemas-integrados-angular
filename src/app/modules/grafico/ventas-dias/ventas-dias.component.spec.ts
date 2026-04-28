import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasDiasComponent } from './ventas-dias.component';

describe('VentasDiasComponent', () => {
  let component: VentasDiasComponent;
  let fixture: ComponentFixture<VentasDiasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentasDiasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasDiasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
