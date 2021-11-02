import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMovimientoStockComponent } from './list-movimiento-stock.component';

describe('ListMovimientoStockComponent', () => {
  let component: ListMovimientoStockComponent;
  let fixture: ComponentFixture<ListMovimientoStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMovimientoStockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListMovimientoStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
