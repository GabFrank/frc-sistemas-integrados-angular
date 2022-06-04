import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListInventarioComponent } from './list-inventario.component';

describe('ListInventarioComponent', () => {
  let component: ListInventarioComponent;
  let fixture: ComponentFixture<ListInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListInventarioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
