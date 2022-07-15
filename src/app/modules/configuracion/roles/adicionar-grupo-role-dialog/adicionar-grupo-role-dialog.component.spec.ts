import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarGrupoRoleDialogComponent } from './adicionar-grupo-role-dialog.component';

describe('AdicionarGrupoRoleDialogComponent', () => {
  let component: AdicionarGrupoRoleDialogComponent;
  let fixture: ComponentFixture<AdicionarGrupoRoleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarGrupoRoleDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarGrupoRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
