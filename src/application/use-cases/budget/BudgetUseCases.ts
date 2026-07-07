import { NewBudgetInput, BudgetStatus } from "@/domain/entities/Budget";
import { BudgetRepository } from "@/domain/repositories";
import { SaleUseCases } from "@/application/use-cases/sale/SaleUseCases";

export class BudgetUseCases {
  constructor(
    private readonly repo: BudgetRepository,
    private readonly saleUseCases: SaleUseCases
  ) {}

  list() {
    return this.repo.findAll();
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  create(input: NewBudgetInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("Adicione ao menos um item ao orçamento.");
    }
    for (const item of input.items) {
      if (!item.productId) throw new Error("Selecione um produto para cada item.");
      if (item.quantity <= 0) throw new Error("A quantidade deve ser maior que zero.");
      if (item.unitPrice < 0) throw new Error("O preço não pode ser negativo.");
    }
    return this.repo.create(input);
  }

  async updateStatus(id: number, status: BudgetStatus) {
    const budget = await this.repo.findById(id);
    if (!budget) throw new Error("Orçamento não encontrado.");
    if (budget.status === "convertido") throw new Error("Este orçamento já foi convertido em venda.");
    return this.repo.updateStatus(id, status);
  }

  async convertToSale(id: number, paymentMethod?: string) {
    const budget = await this.repo.findById(id);
    if (!budget) throw new Error("Orçamento não encontrado.");
    if (budget.status === "convertido") throw new Error("Este orçamento já foi convertido em venda.");

    const itemsWithProduct = budget.items.filter((it) => it.productId !== null);
    if (itemsWithProduct.length === 0) {
      throw new Error("Este orçamento não possui itens vinculados a produtos do estoque para conversão.");
    }

    const sale = await this.saleUseCases.create({
      clientId: budget.clientId,
      clientName: budget.clientName ?? undefined,
      paymentMethod,
      items: itemsWithProduct.map((it) => ({
        productId: it.productId!,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    });

    await this.repo.updateStatus(id, "convertido");
    return sale;
  }

  async delete(id: number) {
    const budget = await this.repo.findById(id);
    if (!budget) throw new Error("Orçamento não encontrado.");
    await this.repo.delete(id);
  }
}
