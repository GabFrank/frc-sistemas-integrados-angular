import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UltimasVentasDialogComponent } from './ultimas-ventas-dialog.component';

describe('UltimasVentasDialogComponent', () => {
  let component: UltimasVentasDialogComponent;
  let fixture: ComponentFixture<UltimasVentasDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UltimasVentasDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UltimasVentasDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
