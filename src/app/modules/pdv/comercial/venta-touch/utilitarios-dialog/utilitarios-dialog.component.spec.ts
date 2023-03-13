import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilitariosDialogComponent } from './utilitarios-dialog.component';

describe('UtilitariosDialogComponent', () => {
  let component: UtilitariosDialogComponent;
  let fixture: ComponentFixture<UtilitariosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UtilitariosDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UtilitariosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
