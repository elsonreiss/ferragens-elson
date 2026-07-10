import { SqliteProductRepository } from "@/infrastructure/repositories/SqliteProductRepository";
import {
  SqliteCategoryRepository,
  SqliteSupplierRepository,
  SqliteStockMovementRepository,
} from "@/infrastructure/repositories/SqliteCommonRepositories";
import { SqliteDashboardRepository } from "@/infrastructure/repositories/SqliteDashboardRepository";
import { SqliteClientRepository } from "@/infrastructure/repositories/SqliteClientRepository";
import { SqlitePurchaseRepository } from "@/infrastructure/repositories/SqlitePurchaseRepository";
import { SqliteSaleRepository } from "@/infrastructure/repositories/SqliteSaleRepository";
import { SqliteExpenseRepository } from "@/infrastructure/repositories/SqliteExpenseRepository";
import { SqliteFinanceRepository } from "@/infrastructure/repositories/SqliteFinanceRepository";
import { SqliteBudgetRepository } from "@/infrastructure/repositories/SqliteBudgetRepository";
import { SqliteReportRepository } from "@/infrastructure/repositories/SqliteReportRepository";
import { SqliteUserRepository } from "@/infrastructure/repositories/SqliteUserRepository";
import { SqliteSessionRepository } from "@/infrastructure/repositories/SqliteSessionRepository";
import { SqliteClientNoteRepository } from "@/infrastructure/repositories/SqliteClientNoteRepository";
import { SqliteLoginAttemptRepository } from "@/infrastructure/repositories/SqliteLoginAttemptRepository";

import { ProductUseCases } from "@/application/use-cases/product/ProductUseCases";
import { StockMovementUseCases } from "@/application/use-cases/product/StockMovementUseCases";
import { DashboardUseCases } from "@/application/use-cases/dashboard/DashboardUseCases";
import { ClientUseCases } from "@/application/use-cases/client/ClientUseCases";
import { SupplierUseCases } from "@/application/use-cases/supplier/SupplierUseCases";
import { PurchaseUseCases } from "@/application/use-cases/purchase/PurchaseUseCases";
import { SaleUseCases } from "@/application/use-cases/sale/SaleUseCases";
import { FinanceUseCases } from "@/application/use-cases/finance/FinanceUseCases";
import { BudgetUseCases } from "@/application/use-cases/budget/BudgetUseCases";
import { ReportUseCases } from "@/application/use-cases/report/ReportUseCases";
import { AuthUseCases } from "@/application/use-cases/auth/AuthUseCases";
import { UserUseCases } from "@/application/use-cases/user/UserUseCases";
import { ClientNoteUseCases } from "@/application/use-cases/clientNote/ClientNoteUseCases";

// Camada de composição: troque as implementações "Sqlite*" por outras (ex: Postgres)
// aqui, sem precisar alterar nenhuma página ou use-case.

const productRepository = new SqliteProductRepository();
const categoryRepository = new SqliteCategoryRepository();
const supplierRepository = new SqliteSupplierRepository();
const stockMovementRepository = new SqliteStockMovementRepository();
const dashboardRepository = new SqliteDashboardRepository();
const clientRepository = new SqliteClientRepository();
const purchaseRepository = new SqlitePurchaseRepository();
const saleRepository = new SqliteSaleRepository();
const expenseRepository = new SqliteExpenseRepository();
const financeRepository = new SqliteFinanceRepository();
const budgetRepository = new SqliteBudgetRepository();
const reportRepository = new SqliteReportRepository();
const userRepository = new SqliteUserRepository();
const sessionRepository = new SqliteSessionRepository();
const clientNoteRepository = new SqliteClientNoteRepository();
const loginAttemptRepository = new SqliteLoginAttemptRepository();

const saleUseCases = new SaleUseCases(saleRepository, productRepository, stockMovementRepository);

export const container = {
  productRepository,
  categoryRepository,
  supplierRepository,
  stockMovementRepository,
  dashboardRepository,
  clientRepository,
  purchaseRepository,
  saleRepository,
  expenseRepository,
  financeRepository,
  budgetRepository,
  reportRepository,
  userRepository,
  sessionRepository,
  clientNoteRepository,
  loginAttemptRepository,
  productUseCases: new ProductUseCases(productRepository),
  stockMovementUseCases: new StockMovementUseCases(productRepository, stockMovementRepository),
  dashboardUseCases: new DashboardUseCases(dashboardRepository),
  clientUseCases: new ClientUseCases(clientRepository),
  supplierUseCases: new SupplierUseCases(supplierRepository),
  purchaseUseCases: new PurchaseUseCases(purchaseRepository, productRepository, stockMovementRepository),
  saleUseCases,
  financeUseCases: new FinanceUseCases(expenseRepository, financeRepository),
  budgetUseCases: new BudgetUseCases(budgetRepository, saleUseCases),
  reportUseCases: new ReportUseCases(reportRepository, saleRepository, productRepository),
  authUseCases: new AuthUseCases(userRepository, sessionRepository, loginAttemptRepository),
  userUseCases: new UserUseCases(userRepository),
  clientNoteUseCases: new ClientNoteUseCases(clientNoteRepository, clientRepository, productRepository, stockMovementRepository),
};
