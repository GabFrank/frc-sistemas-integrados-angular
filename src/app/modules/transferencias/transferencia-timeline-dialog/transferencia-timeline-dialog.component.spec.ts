import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferenciaTimelineDialogComponent } from './transferencia-timeline-dialog.component';

describe('TransferenciaTimelineDialogComponent', () => {
  let component: TransferenciaTimelineDialogComponent;
  let fixture: ComponentFixture<TransferenciaTimelineDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransferenciaTimelineDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferenciaTimelineDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
