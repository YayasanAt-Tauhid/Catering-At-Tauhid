import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Search, 
  Users, 
  ShoppingBag, 
  MoreHorizontal, 
  Loader2,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/PaginationControls';

export default function AdminUsersPage() {
  const { users, isLoading, refetch } = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pagination = usePagination(filteredUsers, { itemsPerPage: 10 });

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery]);

  const totalUsers = users.length;
  const totalOrders = users.reduce((sum, u) => sum + u.order_count, 0);
  const totalRevenue = users.reduce((sum, u) => sum + u.total_spent, 0);

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Data Diperbarui',
      description: 'Daftar user berhasil dimuat ulang',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Daftar User</h1>
          <p className="text-muted-foreground mt-1">Kelola semua pengguna terdaftar</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total User</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Order</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">User</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Kontak</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Penerima</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Order</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Total Belanja</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Role</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Bergabung {format(new Date(user.created_at), 'd MMM yyyy', { locale: id })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm">{user.phone || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary">{user.recipient_count} anak</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium">{user.order_count}</span> order
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-primary">
                          Rp {user.total_spent.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              toast({
                                title: 'Lihat Detail',
                                description: `Detail user ${user.full_name}`,
                              });
                            }}>
                              Lihat Detail
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User tidak ditemukan</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada user terdaftar'}
              </p>
            </div>
          )}
          
          {!isLoading && filteredUsers.length > 0 && (
            <div className="px-6 pb-4">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
