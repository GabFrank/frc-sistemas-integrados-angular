import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarMaletinDialogComponent } from './adicionar-maletin-dialog.component';

describe('AdicionarMaletinDialogComponent', () => {
  let component: AdicionarMaletinDialogComponent;
  let fixture: ComponentFixture<AdicionarMaletinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarMaletinDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarMaletinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
