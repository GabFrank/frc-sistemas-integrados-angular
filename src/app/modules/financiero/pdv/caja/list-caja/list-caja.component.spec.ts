import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCajaComponent } from './list-caja.component';

describe('ListCajaComponent', () => {
  let component: ListCajaComponent;
  let fixture: ComponentFixture<ListCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListCajaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
