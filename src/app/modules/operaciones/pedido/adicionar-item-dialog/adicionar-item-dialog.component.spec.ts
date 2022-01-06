import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarItemDialogComponent } from './adicionar-item-dialog.component';

describe('AdicionarItemDialogComponent', () => {
  let component: AdicionarItemDialogComponent;
  let fixture: ComponentFixture<AdicionarItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
