import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function GuestCartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
  } = useApp();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen gradient-warm flex flex-col">
        <header className="container mx-auto px-4 py-6">
          <Link to="/guest/menu" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Dapoer-Attauhid</span>
          </Link>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in px-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Keranjang Kosong</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Belum ada item di keranjang Anda
          </p>
          <Link to="/guest/menu">
            <Button variant="hero" size="lg">
              Lihat Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/guest/menu")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Keranjang</h1>
            <p className="text-muted-foreground">{getCartItemCount()} item</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-32 lg:pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {cart.map((item) => (
            <Card key={item.menuItem.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.menuItem.image_url ? (
                      <img
                        src={item.menuItem.image_url}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1">
                      {item.menuItem.name}
                    </h3>
                    <p className="text-primary font-medium">
                      Rp {item.menuItem.price.toLocaleString("id-ID")}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() =>
                            updateCartQuantity(
                              item.menuItem.id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() =>
                            updateCartQuantity(
                              item.menuItem.id,
                              item.quantity + 1,
                            )
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.menuItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-bold">
                      Rp{" "}
                      {(item.menuItem.price * item.quantity).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Clear Cart Button */}
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={clearCart}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Kosongkan Keranjang
          </Button>

          {/* Summary Card - Desktop */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({getCartItemCount()} item)
                </span>
                <span className="font-bold">
                  Rp {getCartTotal().toLocaleString("id-ID")}
                </span>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={() => navigate("/guest/checkout")}
              >
                Lanjut Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed Bottom Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">
            Rp {getCartTotal().toLocaleString("id-ID")}
          </span>
        </div>
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={() => navigate("/guest/checkout")}
        >
          Lanjut Checkout
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
