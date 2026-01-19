import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Minus, ShoppingCart, Filter, ImageOff } from 'lucide-react';

export default function MenuPage() {
  const { menuItems, menuItemsLoading, categories, cart, addToCart, updateCartQuantity } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const isAvailable = item.is_available !== false;
    return matchesSearch && matchesCategory && isAvailable;
  });

  const getCartQuantity = (menuItemId: string) => {
    const cartItem = cart.find((item) => item.menuItem.id === menuItemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (menuItem: typeof menuItems[0]) => {
    addToCart(menuItem, 1);
    toast({
      title: 'Ditambahkan ke keranjang',
      description: `${menuItem.name} berhasil ditambahkan`,
    });
  };

  if (menuItemsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-[4/3]" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Menu Makanan</h1>
        <p className="text-muted-foreground mt-1">Pilih menu favorit untuk anak Anda</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline-muted'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Semua
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline-muted'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredItems.map((item) => {
          const quantity = getCartQuantity(item.id);
          return (
            <Card key={item.id} variant="interactive" className="overflow-hidden">
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                {item.is_available === false && (
                  <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-sm">
                      Habis
                    </Badge>
                  </div>
                )}
                <Badge className="absolute top-3 left-3" variant="secondary">
                  {item.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description || 'Tidak ada deskripsi'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  {quantity > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateCartQuantity(item.id, quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{quantity}</span>
                      <Button
                        size="icon-sm"
                        onClick={() => updateCartQuantity(item.id, quantity + 1)}
                        disabled={item.is_available === false}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.is_available === false}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Menu tidak ditemukan</h3>
          <p className="text-muted-foreground">
            {menuItems.length === 0
              ? 'Belum ada menu tersedia'
              : 'Coba ubah kata kunci pencarian atau filter kategori'}
          </p>
        </div>
      )}
    </div>
  );
}
