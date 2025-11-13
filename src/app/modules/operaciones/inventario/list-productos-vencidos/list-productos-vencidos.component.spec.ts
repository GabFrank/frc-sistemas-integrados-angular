import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListProductosVencidosComponent } from './list-productos-vencidos.component';

describe('ListProductosVencidosComponent', () => {
  let component: ListProductosVencidosComponent;
  let fixture: ComponentFixture<ListProductosVencidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListProductosVencidosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListProductosVencidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
