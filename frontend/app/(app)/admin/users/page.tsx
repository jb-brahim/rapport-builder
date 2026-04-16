'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/app/context/language-context';
import { 
  Users, 
  Trash2, 
  Search, 
  Mail, 
  UserCircle,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { md5 } from '@/lib/utils';


interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profile?: {
    name?: string;
    photoUrl?: string;
  };
}

export default function UserManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchUsers();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const data = await apiClient('/admin/users');
      setUsers(data);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"? This will also delete all their reports.`)) {
      try {
        await apiClient(`/admin/users/${id}`, { method: 'DELETE' });
        setUsers(users.filter(u => u._id !== id));
      } catch (e) {
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const name = u.profile?.name || u.name || '';
    const email = u.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });


  if (authLoading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#250136] tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-[#250136]/50 font-bold">Monitor and manage all system accounts</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#250136]/30" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden border-white/60 bg-white/30 shadow-2xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-white/50">
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em]">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden md:table-cell">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] hidden lg:table-cell">Joined</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#250136]/40 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-bold">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="group hover:bg-white/60 transition-all duration-300">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 overflow-hidden">
                        {u.profile?.photoUrl ? (
                          <img src={u.profile.photoUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <img 
                            src={`https://www.gravatar.com/avatar/${md5(u.email.toLowerCase())}?d=mp&s=100`} 
                            alt={u.name} 
                            className="w-full h-full object-cover opacity-60" 
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-[#250136] group-hover:text-primary transition-colors">{u.profile?.name || u.name}</p>
                        <p className="text-[10px] text-[#250136]/40 lowercase flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 hidden md:table-cell">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-primary/5 text-primary border-primary/10'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-[#250136]/40 text-[11px] uppercase">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-[#250136]/30 hover:text-red-500 hover:bg-red-50 transition-all" onClick={() => handleDeleteUser(u._id, u.name)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-[#250136]/30 hover:bg-black/5">
                         <MoreVertical className="w-4 h-4" />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center">
               <p className="text-[#250136]/40 font-bold uppercase tracking-widest text-xs">No users found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
