import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarZonaDialogComponent } from './adicionar-zona-dialog.component';

describe('AdicionarZonaDialogComponent', () => {
  let component: AdicionarZonaDialogComponent;
  let fixture: ComponentFixture<AdicionarZonaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarZonaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarZonaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
