import { NewSaleInput } from "@/domain/entities/Sale";
import { SaleRepository, StockMovementRepository } from "@/domain/repositories";
import { ProductRepository } from "@/domain/repositories/ProductRepository";

export class SaleUseCases {
  constructor(
    private readonly repo: SaleRepository,
    private readonly productRepo: ProductRepository,
    private readonly stockMovementRepo: StockMovementRepository
  ) {}

  list() {
    return this.repo.findAll();
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  async create(input: NewSaleInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("Adicione ao menos um item à venda.");
    }

    const resolvedItems = [];
    for (const item of input.items) {
      if (item.quantity <= 0) throw new Error("A quantidade deve ser maior que zero.");
      if (item.unitPrice < 0) throw new Error("O preço não pode ser negativo.");
      const product = await this.productRepo.findById(item.productId);
      if (!product) throw new Error("Produto não encontrado.");
      if (product.quantity < item.quantity) {
        throw new Error(`Estoque insuficiente de "${product.name}". Disponível: ${product.quantity} ${product.unit}.`);
      }
      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        purchasePrice: product.purchasePrice,
        subtotal: item.quantity * item.unitPrice,
      });
    }

    const total = resolvedItems.reduce((sum, it) => sum + it.subtotal, 0);
    const profit = resolvedItems.reduce((sum, it) => sum + (it.unitPrice - it.purchasePrice) * it.quantity, 0);

    const sale = await this.repo.create(input, resolvedItems, total, profit);

    for (const item of sale.items) {
      if (!item.productId) continue;
      await this.productRepo.adjustQuantity(item.productId, -item.quantity);
      await this.stockMovementRepo.create({
        productId: item.productId,
        type: "saida",
        quantity: item.quantity,
        reason: `Venda #${sale.id}${sale.clientName ? " — " + sale.clientName : ""}`,
      });
    }

    return sale;
  }
}
