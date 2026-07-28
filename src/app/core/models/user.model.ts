export interface TaskModel {

  id: number;

  title: string;

  description: string;

  budget: number;

  requiredWorkers: number;

  deadline: string;

  status?: string;

}