import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarUsuarioDialogComponent } from './adicionar-usuario-dialog.component';

describe('AdicionarUsuarioDialogComponent', () => {
  let component: AdicionarUsuarioDialogComponent;
  let fixture: ComponentFixture<AdicionarUsuarioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarUsuarioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarUsuarioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
