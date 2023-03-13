import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintTicketsComponent } from './print-tickets.component';

describe('PrintTicketsComponent', () => {
  let component: PrintTicketsComponent;
  let fixture: ComponentFixture<PrintTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintTicketsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
