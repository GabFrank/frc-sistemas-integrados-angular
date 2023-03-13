import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFamiliaDialogComponent } from './add-familia-dialog.component';

describe('AddFamiliaDialogComponent', () => {
  let component: AddFamiliaDialogComponent;
  let fixture: ComponentFixture<AddFamiliaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddFamiliaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFamiliaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
