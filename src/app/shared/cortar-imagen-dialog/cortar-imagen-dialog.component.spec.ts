import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CortarImagenDialogComponent } from './cortar-imagen-dialog.component';

describe('CortarImagenDialogComponent', () => {
  let component: CortarImagenDialogComponent;
  let fixture: ComponentFixture<CortarImagenDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CortarImagenDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CortarImagenDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
