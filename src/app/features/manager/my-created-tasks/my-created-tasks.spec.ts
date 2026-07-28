import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCreatedTasks } from './my-created-tasks';

describe('MyCreatedTasks', () => {
  let component: MyCreatedTasks;
  let fixture: ComponentFixture<MyCreatedTasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCreatedTasks],
    }).compileComponents();

    fixture = TestBed.createComponent(MyCreatedTasks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
