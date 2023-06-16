import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LucroPorProductoComponent } from './lucro-por-producto.component';

describe('LucroPorProductoComponent', () => {
  let component: LucroPorProductoComponent;
  let fixture: ComponentFixture<LucroPorProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LucroPorProductoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LucroPorProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
