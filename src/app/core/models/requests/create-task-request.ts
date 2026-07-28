export interface CreateTaskRequest {

  title: string;

  description: string;

  budget: number;

  requiredWorkers: number;

  startTime: string;

  workingHours: number;

  leaveNoticeHours: number;

}