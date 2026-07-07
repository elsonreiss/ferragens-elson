import { DashboardRepository } from "@/domain/repositories";

export class DashboardUseCases {
  constructor(private readonly repo: DashboardRepository) {}

  getSummary() {
    return this.repo.getSummary();
  }
}
