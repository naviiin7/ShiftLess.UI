export interface TaskDetailsModel {

  taskId: number;

  title: string;

  description: string;

  budget: number;

  requiredWorkers: number;

  acceptedWorkers?: number;

  startTime: string;

  workingHours: number;

  endTime: string;

  leaveNoticeHours: number;

  status: string;

  canComplete: boolean;

}