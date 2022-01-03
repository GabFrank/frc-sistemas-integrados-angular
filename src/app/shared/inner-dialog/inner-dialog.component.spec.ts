import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerDialogComponent } from './inner-dialog.component';

describe('InnerDialogComponent', () => {
  let component: InnerDialogComponent;
  let fixture: ComponentFixture<InnerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InnerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InnerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
