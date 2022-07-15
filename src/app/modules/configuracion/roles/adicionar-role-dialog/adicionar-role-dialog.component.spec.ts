import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarRoleDialogComponent } from './adicionar-role-dialog.component';

describe('AdicionarRoleDialogComponent', () => {
  let component: AdicionarRoleDialogComponent;
  let fixture: ComponentFixture<AdicionarRoleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarRoleDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
