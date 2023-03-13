import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinMaletinDialogComponent } from './sin-maletin-dialog.component';

describe('SinMaletinDialogComponent', () => {
  let component: SinMaletinDialogComponent;
  let fixture: ComponentFixture<SinMaletinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SinMaletinDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SinMaletinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
