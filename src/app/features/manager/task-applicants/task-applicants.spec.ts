import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskApplicants } from './task-applicants';

describe('TaskApplicants', () => {
  let component: TaskApplicants;
  let fixture: ComponentFixture<TaskApplicants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskApplicants],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskApplicants);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
