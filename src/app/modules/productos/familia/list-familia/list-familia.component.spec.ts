import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListFamiliaComponent } from './list-familia.component';

describe('ListFamiliaComponent', () => {
  let component: ListFamiliaComponent;
  let fixture: ComponentFixture<ListFamiliaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListFamiliaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFamiliaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
