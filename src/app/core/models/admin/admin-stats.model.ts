export interface AdminStatsModel {

  users: {
    total: number;
    admins: number;
    managers: number;
    workers: number;
    blocked: number;
  };

  tasks: {
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    expired: number;
  };

  applications: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  };

  totalChatMessages: number;

  paidPayments: number;

  totalPaidAmount: number;

}