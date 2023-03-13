import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarSectorDialogComponent } from './adicionar-sector-dialog.component';

describe('AdicionarSectorDialogComponent', () => {
  let component: AdicionarSectorDialogComponent;
  let fixture: ComponentFixture<AdicionarSectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarSectorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarSectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
