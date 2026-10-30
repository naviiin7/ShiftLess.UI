export interface UpdateTaskRequest {

  title: string;

  description: string;

  location: string;

  budget: number;

  requiredWorkers: number;

  startTime: string;

  workingHours: number;

  leaveNoticeHours: number;

}