import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListTransferenciaComponent } from './list-transferencia.component';

describe('ListTransferenciaComponent', () => {
  let component: ListTransferenciaComponent;
  let fixture: ComponentFixture<ListTransferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListTransferenciaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListTransferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
