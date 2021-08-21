import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoTouchComponent } from './pago-touch.component';

describe('PagoTouchComponent', () => {
  let component: PagoTouchComponent;
  let fixture: ComponentFixture<PagoTouchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PagoTouchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagoTouchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
