import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostrarBalanceDialogComponent } from './mostrar-balance-dialog.component';

describe('MostrarBalanceDialogComponent', () => {
  let component: MostrarBalanceDialogComponent;
  let fixture: ComponentFixture<MostrarBalanceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MostrarBalanceDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MostrarBalanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
