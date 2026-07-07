import { NewPurchaseInput } from "@/domain/entities/Purchase";
import { PurchaseRepository } from "@/domain/repositories";
import { ProductRepository } from "@/domain/repositories/ProductRepository";
import { StockMovementRepository } from "@/domain/repositories";

export class PurchaseUseCases {
  constructor(
    private readonly repo: PurchaseRepository,
    private readonly productRepo: ProductRepository,
    private readonly stockMovementRepo: StockMovementRepository
  ) {}

  list() {
    return this.repo.findAll();
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  async create(input: NewPurchaseInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("Adicione ao menos um item à compra.");
    }
    for (const item of input.items) {
      if (!item.productId) throw new Error("Selecione um produto para cada item.");
      if (item.quantity <= 0) throw new Error("A quantidade deve ser maior que zero.");
      if (item.unitPrice < 0) throw new Error("O preço não pode ser negativo.");
    }

    const purchase = await this.repo.create(input);

    for (const item of purchase.items) {
      if (!item.productId) continue;
      await this.productRepo.adjustQuantity(item.productId, item.quantity);
      await this.productRepo.update(item.productId, { purchasePrice: item.unitPrice });
      await this.stockMovementRepo.create({
        productId: item.productId,
        type: "entrada",
        quantity: item.quantity,
        reason: `Compra #${purchase.id}${purchase.supplierName ? " — " + purchase.supplierName : ""}`,
      });
    }

    return purchase;
  }
}
