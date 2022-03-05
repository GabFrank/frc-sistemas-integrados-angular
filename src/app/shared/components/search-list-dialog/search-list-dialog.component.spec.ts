import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchListDialogComponent } from './search-list-dialog.component';

describe('SearchListDialogComponent', () => {
  let component: SearchListDialogComponent;
  let fixture: ComponentFixture<SearchListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchListDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
