import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEnvaseDialogComponent } from './add-envase-dialog.component';

describe('AddEnvaseDialogComponent', () => {
  let component: AddEnvaseDialogComponent;
  let fixture: ComponentFixture<AddEnvaseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEnvaseDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEnvaseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
