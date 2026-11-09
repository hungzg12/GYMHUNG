import {useState,type SubmitEvent} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useApp} from '@/src/app/provider';
import {apiRequest} from '@/src/api/production';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Confirm} from '@/src/components/confirm';
import {errorText} from '@/src/api/client';
import {money,date,decimalSum} from '@/src/utils/format';
type Row={refundId:string;paymentId:string;amount:string;reason:string;status:string;paidAt:string|null;payoutReference:string|null};
export function Refunds(){
 const {data,session}=useApp();
 const query=useQuery({queryKey:['refunds',session?.userId],queryFn:()=>apiRequest<Row[]>('/api/refunds')});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[key,setKey]=useState(()=>crypto.randomUUID()),[reference,setReference]=useState('');
 const [action,setAction]=useState<{id:string;kind:'approve'|'reject'|'pay'}|null>(null);
 if(!data)return null;
 async function submit(event:SubmitEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError('');try{await apiRequest('/api/refunds',{method:'POST',body:JSON.stringify({paymentId:form.get('paymentId'),amount:form.get('amount'),reason:form.get('reason'),requestKey:key})});setKey(crypto.randomUUID());await query.refetch();}catch(e){setError(errorText(e));}finally{setBusy(false);}}
 const rows=query.data??[];
 return <section>
  <h2>Hoàn tiền mặt</h2>
  <p>Đã chi hoàn: {money(decimalSum(rows.filter(row=>row.paidAt).map(row=>row.amount)))}</p>
  <form onSubmit={submit} className="form-grid">
   <label>Khoản thu<select name="paymentId" required disabled={busy}>{data.Payments.filter(p=>p.status==='Completed'&&p.paymentMethod==='Cash').map(p=><option key={p.paymentId} value={p.paymentId}>PT-{p.paymentId} · {money(p.amount)}</option>)}</select></label>
   <label htmlFor="refund-amount">Số tiền hoàn<Input id="refund-amount" name="amount" type="number" min="0.0001" step="0.0001" required disabled={busy}/></label>
   <label htmlFor="refund-reason">Lý do<Input id="refund-reason" name="reason" maxLength={500} required disabled={busy}/></label>
   <Button type="submit" loading={busy}>Tạo yêu cầu</Button>
  </form>
  {error&&<p role="alert">{error}</p>}
  {query.isPending&&<p>Đang tải…</p>}
  {query.error&&<p role="alert">{errorText(query.error)} <Button onClick={()=>void query.refetch()}>Thử lại</Button></p>}
  {rows.map(row=><div className="person-row" key={row.refundId}><div><strong>HT-{row.refundId} · PT-{row.paymentId} · {money(row.amount)}</strong><p>{row.reason}</p><small>{row.paidAt?`Đã chi ${date(row.paidAt,true)} · ${row.payoutReference}`:({Pending:'Chờ duyệt',Approved:'Đã duyệt, chưa chi',Rejected:'Từ chối'}[row.status]??row.status)}</small></div>{row.status==='Pending'&&<><Button onClick={()=>setAction({id:row.refundId,kind:'approve'})}>Duyệt</Button><Button variant="outline" onClick={()=>setAction({id:row.refundId,kind:'reject'})}>Từ chối</Button></>}{row.status==='Approved'&&!row.paidAt&&<Button onClick={()=>{setReference('');setAction({id:row.refundId,kind:'pay'});}}>Xác nhận đã chi</Button>}</div>)}
  {action&&<Confirm title="Xác nhận xử lý hoàn tiền?" description={action.kind==='pay'?'Chỉ xác nhận sau khi thực tế đã trả tiền mặt cho hội viên.':'Quyết định sẽ được lưu trong lịch sử yêu cầu.'} onClose={()=>setAction(null)} onConfirm={async()=>{await apiRequest(`/api/refunds/${action.id}/${action.kind==='pay'?'pay':'review'}`,{method:'POST',body:JSON.stringify(action.kind==='pay'?{reference}:{approve:action.kind==='approve'})});await query.refetch();setAction(null);}}>{action.kind==='pay'&&<label htmlFor="refund-reference">Mã phiếu chi<Input id="refund-reference" value={reference} maxLength={100} onChange={event=>setReference(event.target.value)}/></label>}</Confirm>}
 </section>;
}
