export interface TaskModel {

  taskId: number;

  title: string;

  description: string;

  budget: number;

  requiredWorkers: number;

  acceptedWorkers?: number;

  deadline: string;

  status: string;

}