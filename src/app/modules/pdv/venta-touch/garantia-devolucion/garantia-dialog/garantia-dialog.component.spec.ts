import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarantiaDialogComponent } from './garantia-dialog.component';

describe('GarantiaDialogComponent', () => {
  let component: GarantiaDialogComponent;
  let fixture: ComponentFixture<GarantiaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GarantiaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GarantiaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
