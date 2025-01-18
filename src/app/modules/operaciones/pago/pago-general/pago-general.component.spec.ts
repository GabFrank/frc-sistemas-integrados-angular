import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoGeneralComponent } from './pago-general.component';

describe('PagoGeneralComponent', () => {
  let component: PagoGeneralComponent;
  let fixture: ComponentFixture<PagoGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PagoGeneralComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
