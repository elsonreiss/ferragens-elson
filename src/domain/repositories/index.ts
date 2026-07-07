import { Category, Supplier, NewSupplierInput, SupplierFilters, StockMovement, NewStockMovementInput } from "../entities/Common";
import { DashboardSummary } from "../entities/Dashboard";
import { Client, NewClientInput, ClientFilters } from "../entities/Client";
import { Purchase, NewPurchaseInput } from "../entities/Purchase";
import { Sale, NewSaleInput } from "../entities/Sale";
import { Expense, NewExpenseInput, FinanceSummary } from "../entities/Expense";
import { Budget, NewBudgetInput, BudgetStatus } from "../entities/Budget";
import { MonthlyFinance, SlowMovingProduct, StockValuationRow } from "../entities/Report";
import { User, UserWithHash, NewUserInput, Session } from "../entities/User";

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  create(name: string): Promise<Category>;
}

export interface SupplierRepository {
  findAll(filters?: SupplierFilters): Promise<Supplier[]>;
  findById(id: number): Promise<Supplier | null>;
  create(input: NewSupplierInput): Promise<Supplier>;
  update(id: number, input: Partial<NewSupplierInput>): Promise<Supplier>;
  delete(id: number): Promise<void>;
  count(): Promise<number>;
}

export interface ClientRepository {
  findAll(filters?: ClientFilters): Promise<Client[]>;
  findById(id: number): Promise<Client | null>;
  create(input: NewClientInput): Promise<Client>;
  update(id: number, input: Partial<NewClientInput>): Promise<Client>;
  delete(id: number): Promise<void>;
  count(): Promise<number>;
}

export interface StockMovementRepository {
  create(input: NewStockMovementInput): Promise<StockMovement>;
  findByProduct(productId: number): Promise<StockMovement[]>;
}

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>;
}

export interface PurchaseRepository {
  findAll(): Promise<Purchase[]>;
  findById(id: number): Promise<Purchase | null>;
  create(input: NewPurchaseInput): Promise<Purchase>;
}

export interface SaleRepository {
  findAll(): Promise<Sale[]>;
  findById(id: number): Promise<Sale | null>;
  create(input: NewSaleInput, resolvedItems: Array<{ productId: number; productName: string; quantity: number; unitPrice: number; purchasePrice: number; subtotal: number }>, total: number, profit: number): Promise<Sale>;
}

export interface ExpenseRepository {
  findAll(): Promise<Expense[]>;
  create(input: NewExpenseInput): Promise<Expense>;
  delete(id: number): Promise<void>;
}

export interface FinanceRepository {
  getSummary(): Promise<FinanceSummary>;
}

export interface BudgetRepository {
  findAll(): Promise<Budget[]>;
  findById(id: number): Promise<Budget | null>;
  create(input: NewBudgetInput): Promise<Budget>;
  updateStatus(id: number, status: BudgetStatus): Promise<Budget>;
  delete(id: number): Promise<void>;
}

export interface ReportRepository {
  monthlyFinance(months: number): Promise<MonthlyFinance[]>;
  slowMovingProducts(limit: number): Promise<SlowMovingProduct[]>;
  stockValuation(): Promise<StockValuationRow[]>;
}

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByEmailWithHash(email: string): Promise<UserWithHash | null>;
  create(input: NewUserInput): Promise<User>;
  update(id: number, input: Partial<Omit<NewUserInput, "password">> & { password?: string }): Promise<User>;
  delete(id: number): Promise<void>;
  count(): Promise<number>;
}

export interface SessionRepository {
  create(userId: number): Promise<Session>;
  findByToken(token: string): Promise<Session | null>;
  delete(token: string): Promise<void>;
}
