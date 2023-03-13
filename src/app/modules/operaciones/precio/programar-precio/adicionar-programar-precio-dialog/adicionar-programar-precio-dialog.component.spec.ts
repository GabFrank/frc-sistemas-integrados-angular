import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarProgramarPrecioDialogComponent } from './adicionar-programar-precio-dialog.component';

describe('AdicionarProgramarPrecioDialogComponent', () => {
  let component: AdicionarProgramarPrecioDialogComponent;
  let fixture: ComponentFixture<AdicionarProgramarPrecioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarProgramarPrecioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarProgramarPrecioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
