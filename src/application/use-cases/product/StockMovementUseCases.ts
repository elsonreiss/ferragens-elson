import { NewStockMovementInput } from "@/domain/entities/Common";
import { Product } from "@/domain/entities/Product";
import { ProductRepository } from "@/domain/repositories/ProductRepository";
import { StockMovementRepository } from "@/domain/repositories";

export class StockMovementUseCases {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly movementRepo: StockMovementRepository
  ) {}

  async register(input: NewStockMovementInput): Promise<Product> {
    const product = await this.productRepo.findById(input.productId);
    if (!product) throw new Error("Produto não encontrado.");
    if (input.quantity <= 0) throw new Error("A quantidade da movimentação deve ser maior que zero.");

    let delta = 0;
    if (input.type === "entrada") delta = input.quantity;
    else if (input.type === "saida") {
      if (product.quantity < input.quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.quantity} ${product.unit}.`);
      }
      delta = -input.quantity;
    } else if (input.type === "ajuste") {
      delta = input.quantity - product.quantity;
    }

    await this.movementRepo.create(input);
    return this.productRepo.adjustQuantity(product.id, delta);
  }

  history(productId: number) {
    return this.movementRepo.findByProduct(productId);
  }
}
