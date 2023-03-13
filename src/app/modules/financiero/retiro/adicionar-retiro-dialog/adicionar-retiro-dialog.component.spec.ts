import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarRetiroDialogComponent } from './adicionar-retiro-dialog.component';

describe('AdicionarRetiroDialogComponent', () => {
  let component: AdicionarRetiroDialogComponent;
  let fixture: ComponentFixture<AdicionarRetiroDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarRetiroDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarRetiroDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
