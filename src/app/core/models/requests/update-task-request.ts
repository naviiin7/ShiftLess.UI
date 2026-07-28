export interface UpdateTaskRequest {

  title: string;

  description: string;

  budget: number;

  requiredWorkers: number;

  startTime: string;

  workingHours: number;

  leaveNoticeHours: number;

}