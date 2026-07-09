import { NewClientNoteItemInput, NewClientNotePaymentInput, MarkItemsPaidInput } from "@/domain/entities/ClientNote";
import { ClientNoteRepository, ClientRepository, StockMovementRepository } from "@/domain/repositories";
import { ProductRepository } from "@/domain/repositories/ProductRepository";

const EPSILON = 0.005;

export class ClientNoteUseCases {
  constructor(
    private readonly repo: ClientNoteRepository,
    private readonly clientRepo: ClientRepository,
    private readonly productRepo: ProductRepository,
    private readonly stockMovementRepo: StockMovementRepository
  ) {}

  list() {
    return this.repo.findAll();
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  getByClientId(clientId: number) {
    return this.repo.findByClientId(clientId);
  }

  // Cada cliente tem uma única nota, que vai acumulando compras fiado ao
  // longo do tempo. Se ainda não existir, cria na hora.
  async getOrCreateForClient(clientId: number) {
    const client = await this.clientRepo.findById(clientId);
    if (!client) throw new Error("Cliente não encontrado.");

    const existing = await this.repo.findByClientId(clientId);
    if (existing) return existing;

    return this.repo.create(clientId, client.name);
  }

  async addItem(noteId: number, input: NewClientNoteItemInput) {
    if (input.quantity <= 0) throw new Error("A quantidade deve ser maior que zero.");
    if (input.unitPrice < 0) throw new Error("O preço não pode ser negativo.");

    const note = await this.repo.findById(noteId);
    if (!note) throw new Error("Nota não encontrada.");

    if (input.productId) {
      const product = await this.productRepo.findById(input.productId);
      if (!product) throw new Error("Produto não encontrado.");
      if (product.quantity < input.quantity) {
        throw new Error(`Estoque insuficiente de "${product.name}". Disponível: ${product.quantity} ${product.unit}.`);
      }

      const updated = await this.repo.addItem(noteId, {
        productId: product.id,
        productName: product.name,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
      });

      await this.productRepo.adjustQuantity(product.id, -input.quantity);
      await this.stockMovementRepo.create({
        productId: product.id,
        type: "saida",
        quantity: input.quantity,
        reason: `Fiado — ${note.clientName}`,
      });

      return updated;
    }

    // Item avulso (não cadastrado no estoque): entra na nota, mas não baixa
    // nem movimenta estoque.
    const productName = input.productName?.trim();
    if (!productName) throw new Error("Informe o nome do item avulso.");

    return this.repo.addItem(noteId, {
      productId: null,
      productName,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
    });
  }

  async removeItem(noteId: number, itemId: number) {
    const note = await this.repo.findById(noteId);
    if (!note) throw new Error("Nota não encontrada.");

    const { note: updated, removed } = await this.repo.removeItem(noteId, itemId);

    if (removed.productId) {
      await this.productRepo.adjustQuantity(removed.productId, removed.quantity);
      await this.stockMovementRepo.create({
        productId: removed.productId,
        type: "entrada",
        quantity: removed.quantity,
        reason: `Remoção de item da nota fiado (${note.clientName})`,
      });
    }

    return updated;
  }

  async addPayment(noteId: number, input: NewClientNotePaymentInput) {
    if (input.amount <= 0) throw new Error("O valor do pagamento deve ser maior que zero.");

    const note = await this.repo.findById(noteId);
    if (!note) throw new Error("Nota não encontrada.");
    if (input.amount > note.balance + EPSILON) {
      throw new Error(`O valor informado é maior que o saldo devedor (${note.balance.toFixed(2)}).`);
    }

    return this.repo.addPayment(noteId, input);
  }

  // Marca itens específicos da nota como pagos (útil quando o cliente paga
  // só parte da nota) — cria um pagamento no valor exato da soma desses
  // itens e os marca individualmente.
  async markItemsPaid(noteId: number, input: MarkItemsPaidInput) {
    if (!input.itemIds || input.itemIds.length === 0) {
      throw new Error("Selecione ao menos um item para marcar como pago.");
    }

    const note = await this.repo.findById(noteId);
    if (!note) throw new Error("Nota não encontrada.");

    return this.repo.markItemsPaid(noteId, input);
  }

  async delete(id: number) {
    const note = await this.repo.findById(id);
    if (!note) throw new Error("Nota não encontrada.");

    for (const item of note.items) {
      if (!item.productId) continue;
      await this.productRepo.adjustQuantity(item.productId, item.quantity);
      await this.stockMovementRepo.create({
        productId: item.productId,
        type: "entrada",
        quantity: item.quantity,
        reason: `Exclusão da nota fiado (${note.clientName})`,
      });
    }

    await this.repo.delete(id);
  }
}
