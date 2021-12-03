import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarCajaDialogComponent } from './adicionar-caja-dialog.component';

describe('AdicionarCajaDialogComponent', () => {
  let component: AdicionarCajaDialogComponent;
  let fixture: ComponentFixture<AdicionarCajaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarCajaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarCajaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
