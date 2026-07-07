import { Badge } from "@/components/ui/Badge";
import { Product, getStockStatus } from "@/domain/entities/Product";

export function StockStatusBadge({ product }: { product: Pick<Product, "quantity" | "minStock"> }) {
  const status = getStockStatus(product);
  if (status === "falta") return <Badge tone="danger">Em falta</Badge>;
  if (status === "baixo") return <Badge tone="warning">Estoque baixo</Badge>;
  return <Badge tone="success">Ok</Badge>;
}
