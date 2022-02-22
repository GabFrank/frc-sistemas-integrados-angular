import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchEnvaseDialogComponent } from './search-envase-dialog.component';

describe('SearchEnvaseDialogComponent', () => {
  let component: SearchEnvaseDialogComponent;
  let fixture: ComponentFixture<SearchEnvaseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchEnvaseDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchEnvaseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
