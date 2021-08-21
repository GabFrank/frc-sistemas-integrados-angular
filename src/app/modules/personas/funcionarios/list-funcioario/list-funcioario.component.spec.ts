import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListFuncioarioComponent } from './list-funcioario.component';

describe('ListFuncioarioComponent', () => {
  let component: ListFuncioarioComponent;
  let fixture: ComponentFixture<ListFuncioarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListFuncioarioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFuncioarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
