import { TaskStatus } from "@prisma/client";

export interface UpdateTaskData {
  name: string;
  status: TaskStatus;
  taskDescription: string;
  deadline: string;
  executorDescription: string;
}
