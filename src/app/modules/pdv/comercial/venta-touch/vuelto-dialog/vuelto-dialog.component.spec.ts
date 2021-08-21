import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VueltoDialogComponent } from './vuelto-dialog.component';

describe('VueltoDialogComponent', () => {
  let component: VueltoDialogComponent;
  let fixture: ComponentFixture<VueltoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VueltoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VueltoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
