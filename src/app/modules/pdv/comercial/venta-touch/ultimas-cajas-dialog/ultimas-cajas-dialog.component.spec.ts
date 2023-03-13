import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UltimasCajasDialogComponent } from './ultimas-cajas-dialog.component';

describe('UltimasCajasDialogComponent', () => {
  let component: UltimasCajasDialogComponent;
  let fixture: ComponentFixture<UltimasCajasDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UltimasCajasDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UltimasCajasDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
