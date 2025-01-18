import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoGeneralListComponent } from './pago-general-list.component';

describe('PagoGeneralListComponent', () => {
  let component: PagoGeneralListComponent;
  let fixture: ComponentFixture<PagoGeneralListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PagoGeneralListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoGeneralListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
