import { useState } from "react";
import { ProductWithZone } from "@shared/schema";
import EditProductModal from "./client/src/components/edit-product-modal";

// Test component to debug the EditProductModal
export default function DebugEditModal() {
  const [isOpen, setIsOpen] = useState(true);
  
  const testProduct: ProductWithZone = {
    id: 1,
    productId: "TEST-001",
    name: "Test Product",
    description: "A test product",
    category: "Test",
    zoneId: 1,
    currentStock: 10,
    minStock: 5,
    unitPrice: 19.99,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    zone: {
      id: 1,
      name: "Test Zone",
      description: "Test zone",
      capacity: 100,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Edit Modal</button>
      <EditProductModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        product={testProduct} 
      />
    </div>
  );
}