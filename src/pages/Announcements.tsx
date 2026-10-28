import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Trash2, Calendar, Tag, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import type { Announcement, AnnouncementCategory, User } from '../types.js';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    category: AnnouncementCategory;
    expiresAt: string;
  }>({
    title: '',
    content: '',
    category: 'General',
    expiresAt: ''
  });

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; announcements: Announcement[] }>('/announcements');
      if (res.success) {
        setAnnouncements(res.announcements);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showToast('Please provide both title and content.', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/announcements', formData);
      showToast(res.message, 'success');
      setShowCreateModal(false);
      setFormData({ title: '', content: '', category: 'General', expiresAt: '' });
      loadAnnouncements();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish announcement', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      showToast('Announcement deleted.', 'success');
      loadAnnouncements();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete announcement', 'error');
    }
  };

  const categories = ['All', 'Company Policy', 'Event', 'Urgent', 'General'];

  const filtered = selectedCategory === 'All'
    ? announcements
    : announcements.filter(a => a.category === selectedCategory);

  const getCategoryBadge = (cat: AnnouncementCategory) => {
    switch (cat) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Company Policy':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Event':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Announcements</h1>
          <p className="text-xs text-slate-500">
            Official company news, town hall meetings, and workplace policy updates.
          </p>
        </div>

        {user?.role === 'HR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200">
            <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block mr-2 align-middle" />
            Loading bulletin...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200 text-xs">
            No announcements found in this category.
          </div>
        ) : (
          filtered.map(ann => {
            const author = ann.author as User;
            return (
              <div
                key={ann._id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadge(ann.category)}`}>
                      {ann.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      Published {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {user?.role === 'HR' && (
                    <button
                      onClick={() => handleDelete(ann._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{ann.title}</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{ann.content}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Author: {author?.fullName || 'HR Administration'} ({author?.role || 'HR'})</span>
                  {ann.expiresAt && (
                    <span className="text-[11px] font-mono">
                      Expires: {new Date(ann.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Publish Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Publish Company Announcement</h3>
                <p className="text-xs text-slate-500">Will be broadcasted to all active workforce members.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Q4 Town Hall Meeting & Product Strategy"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as AnnouncementCategory })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Company Policy">Company Policy</option>
                    <option value="Event">Event</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content / Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed announcement content..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Publish & Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
