import { useState } from 'react';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCancelarEntrada } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { canCancelEntry } from '@/lib/exitValue';

export default function CancelEntryButton({ mov, onCanceled }: {
  mov: { id: string; placa: string; status_movimentacao: string; status_pagamento?: string };
  onCanceled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const cancelar = useCancelarEntrada();
  const { toast } = useToast();
  if (!canCancelEntry(mov)) return null;
  return <>
    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" title={`Cancelar entrada de ${mov.placa}`} aria-label={`Cancelar entrada de ${mov.placa}`} onClick={e => { e.stopPropagation(); setOpen(true); }}>
      <Ban className="h-5 w-5" />
    </Button>
    <Dialog open={open} onOpenChange={value => { if (!cancelar.isPending) setOpen(value); }}>
      <DialogContent onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Cancelar entrada — {mov.placa}</DialogTitle>
          <DialogDescription>O ticket será cancelado, o veículo sairá do pátio e não haverá receita. O histórico será mantido.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`motivo-${mov.id}`}>Motivo do cancelamento</Label>
          <Input id={`motivo-${mov.id}`} value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={500} autoFocus />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={cancelar.isPending} onClick={() => setOpen(false)}>Voltar</Button>
          <Button variant="destructive" disabled={!motivo.trim() || cancelar.isPending} onClick={() => cancelar.mutate({ id: mov.id, motivo }, {
            onSuccess: () => { setOpen(false); setMotivo(''); toast({ title: 'Entrada cancelada', description: `${mov.placa} — sem receita no financeiro.` }); onCanceled?.(); },
            onError: (error: Error) => toast({ title: 'Não foi possível cancelar', description: error.message, variant: 'destructive' }),
          })}><Ban className="mr-2 h-4 w-4" />{cancelar.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}