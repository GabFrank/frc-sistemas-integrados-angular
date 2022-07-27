import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFacturaLegalComponent } from './list-factura-legal.component';

describe('ListFacturaLegalComponent', () => {
  let component: ListFacturaLegalComponent;
  let fixture: ComponentFixture<ListFacturaLegalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListFacturaLegalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFacturaLegalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
