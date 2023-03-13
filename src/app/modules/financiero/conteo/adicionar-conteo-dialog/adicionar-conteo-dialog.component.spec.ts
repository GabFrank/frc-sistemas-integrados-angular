import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarConteoDialogComponent } from './adicionar-conteo-dialog.component';

describe('AdicionarConteoDialogComponent', () => {
  let component: AdicionarConteoDialogComponent;
  let fixture: ComponentFixture<AdicionarConteoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarConteoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarConteoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
