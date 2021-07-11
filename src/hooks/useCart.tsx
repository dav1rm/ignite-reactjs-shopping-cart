import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      let product = updatedCart.find(product => product.id === productId);

      const response = await api.get<Stock>(`/stock/${productId}`);
      const currentStock = response.data.amount;
      const currentAmount = product ? product.amount : 0;
      const amount = currentAmount + 1;

      if (amount > currentStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (product) {
        product.amount = amount;
      } else {
        const response = await api.get<Product>(`/products/${productId}`);
        const NewProduct = { ...response.data, amount: 1 };
        updatedCart.push(NewProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch (err) {
      console.log(err);

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex) {
        const updatedCart = cart.splice(productIndex, 1);

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      if (response.data.amount <= 0) {
        return;
      }

      if (amount > response.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
