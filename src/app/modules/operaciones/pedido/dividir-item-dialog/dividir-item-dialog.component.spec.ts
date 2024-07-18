import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DividirItemDialogComponent } from './dividir-item-dialog.component';

describe('DividirItemDialogComponent', () => {
  let component: DividirItemDialogComponent;
  let fixture: ComponentFixture<DividirItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DividirItemDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DividirItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
