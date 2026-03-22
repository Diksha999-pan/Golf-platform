'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Trophy, CheckCircle } from 'lucide-react'

export default function WinnerProofPage({ params }: { params: { winnerId: string } }) {
  const supabase = createClient()
  const [winner, setWinner] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('winners')
        .select('*, draw:draws(draw_date), proof:winner_proofs(*)')
        .eq('id', params.winnerId)
        .eq('user_id', user.id)
        .single()
      setWinner(data)
      setUploaded(data?.proof?.length > 0)
    }
    fetch()
  }, [params.winnerId])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !winner) return
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const ext = file.name.split('.').pop()
      const path = `winner-proofs/${winner.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(path)

      const { error: insertError } = await supabase.from('winner_proofs').insert({
        winner_id: winner.id,
        file_url: publicUrl,
        admin_status: 'pending',
      })
      if (insertError) throw insertError

      toast.success('Proof uploaded! Admin will review shortly.')
      setUploaded(true)
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!winner) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Winner verification</h1>
        <p className="text-white/40">Upload proof of your winning scores</p>
      </div>

      <div className="card p-6 mb-6 border-gold-500/20 bg-gold-500/5">
        <div className="flex items-center gap-3 mb-3">
          <Trophy size={20} className="text-gold-400" />
          <span className="font-medium text-gold-400">{winner.match_count}-number match winner!</span>
        </div>
        <div className="text-sm text-white/60">
          Prize amount: <span className="text-gold-400 font-semibold">£{winner.prize_amount?.toFixed(2)}</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          {winner.matched_numbers?.map((n: number) => (
            <span key={n} className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-300 text-sm font-bold flex items-center justify-center">{n}</span>
          ))}
        </div>
      </div>

      {uploaded ? (
        <div className="card p-8 text-center">
          <CheckCircle size={32} className="text-brand-400 mx-auto mb-3" />
          <h2 className="font-medium text-lg mb-2">Proof submitted</h2>
          <p className="text-white/40 text-sm">An admin will review your submission and process your payment.</p>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="card p-6">
          <h2 className="font-medium mb-2">Upload score screenshot</h2>
          <p className="text-sm text-white/40 mb-5">Please upload a screenshot from your golf platform showing your scores for the draw period.</p>

          <div className={`border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-colors ${
            file ? 'border-brand-500/50 bg-brand-500/5' : 'border-white/10 hover:border-white/20'
          }`}>
            <input type="file" accept="image/*,.pdf" id="file-upload"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="hidden" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload size={24} className="text-white/30 mx-auto mb-3" />
              {file ? (
                <div className="text-brand-400 font-medium">{file.name}</div>
              ) : (
                <>
                  <div className="text-white/50 mb-1">Click to upload or drag and drop</div>
                  <div className="text-xs text-white/30">PNG, JPG, PDF up to 10MB</div>
                </>
              )}
            </label>
          </div>

          <button type="submit" disabled={!file || uploading} className="btn-primary w-full justify-center py-3.5">
            {uploading ? 'Uploading...' : 'Submit proof'}
          </button>
        </form>
      )}
    </div>
  )
}
