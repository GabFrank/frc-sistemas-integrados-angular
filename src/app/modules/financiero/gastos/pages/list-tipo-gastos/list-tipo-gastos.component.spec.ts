import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListTipoGastosComponent } from './list-tipo-gastos.component';

describe('ListTipoGastosComponent', () => {
  let component: ListTipoGastosComponent;
  let fixture: ComponentFixture<ListTipoGastosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListTipoGastosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListTipoGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
