'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { Testimonial } from '@/lib/types';

const emptyForm = { name: '', photoUrl: '', text: '', rating: 5, youtubeVideo: '' };

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setItems(await adminFetch('/testimonials'));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        name: String(form.name || '').trim(),
        photoUrl: String(form.photoUrl || '').trim(),
        text: String(form.text || '').trim(),
        youtubeVideo: String(form.youtubeVideo || '').trim(),
        rating: Number(form.rating)
      };

      if (editingId) {
        await adminFetch(`/testimonials/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/testimonials', { method: 'POST', body: JSON.stringify(payload) });
      }

      setForm(emptyForm);
      setEditingId(null);
      setSuccess(editingId ? 'Depoimento atualizado com sucesso.' : 'Depoimento cadastrado com sucesso.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o depoimento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Gerenciar depoimentos">
      <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="card-premium p-6 space-y-3">
          <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          <input placeholder="Foto URL opcional" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          <input placeholder="Vídeo YouTube opcional" value={form.youtubeVideo} onChange={(e) => setForm({ ...form, youtubeVideo: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          <input type="number" min={1} max={5} placeholder="Avaliação" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          <textarea placeholder="Texto" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={5} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {success ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</p> : null}
          <button disabled={saving} onClick={submit} className="w-full rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d] disabled:cursor-not-allowed disabled:opacity-70">{saving ? 'Salvando...' : editingId ? 'Atualizar depoimento' : 'Salvar depoimento'}</button>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card-premium flex items-center justify-between gap-4 p-6">
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-zinc-400">{'★'.repeat(item.rating)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setEditingId(item.id); setForm(item); setError(''); setSuccess(''); }} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Editar</button>
                <button onClick={async () => { await adminFetch(`/testimonials/${item.id}`, { method: 'DELETE' }); load(); }} className="rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-300">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
