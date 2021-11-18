import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarPersonaDialogComponent } from './adicionar-persona-dialog.component';

describe('AdicionarPersonaDialogComponent', () => {
  let component: AdicionarPersonaDialogComponent;
  let fixture: ComponentFixture<AdicionarPersonaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarPersonaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarPersonaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
