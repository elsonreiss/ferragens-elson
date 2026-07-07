import { ReportRepository, SaleRepository } from "@/domain/repositories";
import { ProductRepository } from "@/domain/repositories/ProductRepository";

export class ReportUseCases {
  constructor(
    private readonly repo: ReportRepository,
    private readonly saleRepo: SaleRepository,
    private readonly productRepo: ProductRepository
  ) {}

  monthlyFinance(months = 6) {
    return this.repo.monthlyFinance(months);
  }

  slowMovingProducts(limit = 10) {
    return this.repo.slowMovingProducts(limit);
  }

  stockValuation() {
    return this.repo.stockValuation();
  }

  allSales() {
    return this.saleRepo.findAll();
  }

  topSelling(limit = 10) {
    return this.productRepo.topSelling(limit);
  }
}
