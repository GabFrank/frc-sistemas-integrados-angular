import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListVentaCreditoComponent } from './list-venta-credito.component';

describe('ListVentaCreditoComponent', () => {
  let component: ListVentaCreditoComponent;
  let fixture: ComponentFixture<ListVentaCreditoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListVentaCreditoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListVentaCreditoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
