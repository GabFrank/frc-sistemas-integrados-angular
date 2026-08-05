import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverySucursalComponent } from './delivery-sucursal.component';

describe('DeliverySucursalComponent', () => {
  let component: DeliverySucursalComponent;
  let fixture: ComponentFixture<DeliverySucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliverySucursalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliverySucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
