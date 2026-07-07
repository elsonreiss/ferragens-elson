import { NewExpenseInput } from "@/domain/entities/Expense";
import { ExpenseRepository, FinanceRepository } from "@/domain/repositories";

export class FinanceUseCases {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly financeRepo: FinanceRepository
  ) {}

  getSummary() {
    return this.financeRepo.getSummary();
  }

  listExpenses() {
    return this.expenseRepo.findAll();
  }

  createExpense(input: NewExpenseInput) {
    if (!input.description?.trim()) throw new Error("A descrição da despesa é obrigatória.");
    if (input.amount <= 0) throw new Error("O valor deve ser maior que zero.");
    return this.expenseRepo.create(input);
  }

  deleteExpense(id: number) {
    this.expenseRepo.delete(id);
  }
}
