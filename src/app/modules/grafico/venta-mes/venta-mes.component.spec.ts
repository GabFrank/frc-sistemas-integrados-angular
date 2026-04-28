import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaMesComponent } from './venta-mes.component';

describe('VentaMesComponent', () => {
  let component: VentaMesComponent;
  let fixture: ComponentFixture<VentaMesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentaMesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentaMesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
