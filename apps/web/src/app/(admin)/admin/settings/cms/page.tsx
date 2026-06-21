'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Testimonial } from '@/types/api.types';
import Swal from 'sweetalert2';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IconTrash, IconEdit, IconUpload, IconPlus } from '@tabler/icons-react';

export default function CMSManagementPage() {
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Homepage Settings
  const [homepageSettings, setHomepageSettings] = useState({
    whatsappNumber: '',
    heroHeadline: '',
    heroSubheadline: '',
    contactEmail: ''
  });

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<Partial<Testimonial>>({
    authorName: '',
    authorTitle: '',
    avatarUrl: '',
    rating: 5,
    quoteText: '',
    isPublished: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cmsRes, testRes] = await Promise.all([
        apiFetch<Record<string, string>>('/cms/homepage'),
        apiFetch<Testimonial[]>('/testimonials', { token: accessToken || undefined }),
      ]);
      setHomepageSettings({
        whatsappNumber: cmsRes.whatsappNumber || '',
        heroHeadline: cmsRes.heroHeadline || '',
        heroSubheadline: cmsRes.heroSubheadline || '',
        contactEmail: cmsRes.contactEmail || '',
      });
      setTestimonials(testRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHomepage = async () => {
    try {
      await apiFetch('/cms/homepage', {
        method: 'PUT',
        token: accessToken || undefined,
        body: { data: homepageSettings },
      });
      Swal.fire('Success', 'Homepage settings updated successfully', 'success');
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire('Error', err.message || 'Failed to update settings', 'error');
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await apiFetch(`/testimonials/${id}`, {
        method: 'DELETE',
        token: accessToken || undefined,
      });
      fetchData();
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire('Error', err.message || 'Failed to delete testimonial', 'error');
    }
  };

  const uploadFile = async (url: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = accessToken;
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${url}`, {
        method: 'POST',
        headers,
        body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.data || data;
  }

  // Rewrite handleSaveTestimonial to use direct fetch for FormData
  const handleSaveTestimonialFixed = async () => {
    try {
      let avatarUrl = currentTestimonial.avatarUrl;

      if (avatarFile) {
        const uploadRes = await uploadFile('/uploads/avatar', avatarFile);
        avatarUrl = uploadRes.fileUrl;
      }

      const payload = {
        authorName: currentTestimonial.authorName,
        authorTitle: currentTestimonial.authorTitle,
        avatarUrl,
        rating: Number(currentTestimonial.rating),
        quoteText: currentTestimonial.quoteText,
        isPublished: currentTestimonial.isPublished,
      };

      if (currentTestimonial.id) {
        await apiFetch(`/testimonials/${currentTestimonial.id}`, {
          method: 'PUT',
          token: accessToken || undefined,
          body: payload,
        });
      } else {
        await apiFetch('/testimonials', {
          method: 'POST',
          token: accessToken || undefined,
          body: payload,
        });
      }

      Swal.fire('Success', 'Testimonial saved', 'success');
      setShowTestimonialModal(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire('Error', err.message || 'Failed to save testimonial', 'error');
    }
  };


  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading CMS...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage homepage content, WhatsApp numbers, and testimonials.</p>
      </div>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Homepage & Contact Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hero Headline</label>
            <Input 
              value={homepageSettings.heroHeadline || ''} 
              onChange={e => setHomepageSettings({...homepageSettings, heroHeadline: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hero Subheadline</label>
            <Input 
              value={homepageSettings.heroSubheadline || ''} 
              onChange={e => setHomepageSettings({...homepageSettings, heroSubheadline: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Primary WhatsApp Number</label>
            <Input 
              value={homepageSettings.whatsappNumber || ''} 
              onChange={e => setHomepageSettings({...homepageSettings, whatsappNumber: e.target.value})} 
              placeholder="e.g. 62812345678"
            />
            <p className="text-xs text-slate-500 mt-1">Used globally across the platform (e.g. Sales inquiries)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
            <Input 
              value={homepageSettings.contactEmail || ''} 
              onChange={e => setHomepageSettings({...homepageSettings, contactEmail: e.target.value})} 
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveHomepage} className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Testimonials</h2>
          <Button 
            onClick={() => {
              setCurrentTestimonial({ authorName: '', authorTitle: '', rating: 5, quoteText: '', isPublished: true, avatarUrl: '' });
              setAvatarFile(null);
              setShowTestimonialModal(true);
            }} 
            size="sm" 
            className="flex items-center gap-1"
          >
            <IconPlus size={16} /> Add Testimonial
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-slate-500">No testimonials found.</TableCell>
              </TableRow>
            ) : (
              testimonials.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl.startsWith('http') ? t.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${t.avatarUrl}`} alt={t.authorName} className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          {t.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{t.authorName}</div>
                        <div className="text-xs text-slate-500">{t.authorTitle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex text-amber-500 text-xs">
                      {Array(5).fill(0).map((_, i) => (
                        <span key={i}>{i < t.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
                    {t.quoteText}
                  </TableCell>
                  <TableCell>
                    {t.isPublished ? (
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Published</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setCurrentTestimonial(t);
                      setAvatarFile(null);
                      setShowTestimonialModal(true);
                    }} className="text-blue-600">
                      <IconEdit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTestimonial(t.id)} className="text-red-600">
                      <IconTrash size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Testimonial Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">{currentTestimonial.id ? 'Edit Testimonial' : 'New Testimonial'}</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Author Name</label>
                <Input value={currentTestimonial.authorName || ''} onChange={e => setCurrentTestimonial({...currentTestimonial, authorName: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Author Title / Location</label>
                <Input value={currentTestimonial.authorTitle || ''} onChange={e => setCurrentTestimonial({...currentTestimonial, authorTitle: e.target.value})} placeholder="e.g. CEO of X, or Jakarta" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Avatar Image (Optional)</label>
                <div className="flex items-center gap-3">
                  {(avatarFile || currentTestimonial.avatarUrl) && (
                    <img 
                      src={avatarFile ? URL.createObjectURL(avatarFile) : (currentTestimonial.avatarUrl?.startsWith('http') ? currentTestimonial.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${currentTestimonial.avatarUrl}`)} 
                      alt="Avatar preview" 
                      className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-200"
                    />
                  )}
                  <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1-5)</label>
                <Input type="number" min="1" max="5" value={currentTestimonial.rating || 5} onChange={e => setCurrentTestimonial({...currentTestimonial, rating: Number(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quote</label>
                <Textarea value={currentTestimonial.quoteText || ''} onChange={e => setCurrentTestimonial({...currentTestimonial, quoteText: e.target.value})} className="h-24 resize-none" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="published" checked={currentTestimonial.isPublished} onChange={e => setCurrentTestimonial({...currentTestimonial, isPublished: e.target.checked})} />
                <label htmlFor="published" className="text-sm text-slate-700">Published (visible on website)</label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTestimonialModal(false)}>Cancel</Button>
              <Button onClick={handleSaveTestimonialFixed} className="bg-blue-600 hover:bg-blue-700">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
