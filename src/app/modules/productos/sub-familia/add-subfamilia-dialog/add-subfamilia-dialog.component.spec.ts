import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSubfamiliaDialogComponent } from './add-subfamilia-dialog.component';

describe('AddSubfamiliaDialogComponent', () => {
  let component: AddSubfamiliaDialogComponent;
  let fixture: ComponentFixture<AddSubfamiliaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddSubfamiliaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSubfamiliaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
