import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecioDeliveryComponent } from './precio-delivery.component';

describe('PrecioDeliveryComponent', () => {
  let component: PrecioDeliveryComponent;
  let fixture: ComponentFixture<PrecioDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrecioDeliveryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecioDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
