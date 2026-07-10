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

  listPage(page: number, pageSize: number) {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 20));
    return this.repo.findPage(safePage, safePageSize);
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  async create(input: NewSaleInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("Adicione ao menos um item à venda.");
    }

    const resolvedItems: Array<{
      productId: number | null;
      productName: string;
      quantity: number;
      unitPrice: number;
      purchasePrice: number;
      subtotal: number;
    }> = [];
    for (const item of input.items) {
      if (item.quantity <= 0) throw new Error("A quantidade deve ser maior que zero.");
      if (item.unitPrice < 0) throw new Error("O preço não pode ser negativo.");

      if (item.productId) {
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
        continue;
      }

      // Item avulso (não cadastrado no estoque): não gera baixa nem lucro
      // calculado (não há preço de compra de referência).
      const productName = item.productName?.trim();
      if (!productName) throw new Error("Informe o nome do item avulso.");
      resolvedItems.push({
        productId: null,
        productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        purchasePrice: 0,
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

  // Exclui a venda e devolve ao estoque os itens vinculados a produtos
  // cadastrados (itens avulsos não afetaram estoque, então não são
  // devolvidos). Restrito a admin — checado na rota da API.
  async delete(id: number) {
    const sale = await this.repo.findById(id);
    if (!sale) throw new Error("Venda não encontrada.");

    for (const item of sale.items) {
      if (!item.productId) continue;
      await this.productRepo.adjustQuantity(item.productId, item.quantity);
      await this.stockMovementRepo.create({
        productId: item.productId,
        type: "entrada",
        quantity: item.quantity,
        reason: `Exclusão de venda${sale.clientName ? " — " + sale.clientName : ""}`,
      });
    }

    await this.repo.delete(id);
  }
}
