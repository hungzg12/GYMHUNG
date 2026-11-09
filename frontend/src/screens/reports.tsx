import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Download} from 'lucide-react';
import {PageHeading,Loading,ErrorState} from '@/src/components/common';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import {can} from '@/src/app/permissions';
import {useApp} from '@/src/app/provider';
import {isMock} from '@/src/api/service';
import {apiRequest} from '@/src/api/production';
import {date,decimalSum,money,localDate,offsetDate} from '@/src/utils/format';
import {lookup} from '@/src/features/resources/config';
import {errorText} from '@/src/api/client';
type Row={label:string;value:string|number};
export function Reports(){
 const {data,session}=useApp();const choices=Object.entries({revenue:{title:'Doanh thu đã thu',permission:'payments.read'},members:{title:'Hội viên mới',permission:'members.read'},packages:{title:'Đăng ký gói tập',permission:'packages.read'},checkins:{title:'Lượt vào gym',permission:'checkins.read'},maintenance:{title:'Chi phí bảo trì',permission:'equipment.read'}}).filter(([,v])=>can(session,v.permission));const [type,setType]=useState(choices[0]?.[0]??'members'),[from,setFrom]=useState(offsetDate(-30)),[to,setTo]=useState(localDate());
 const report=useQuery({queryKey:['reports',session?.userId,session?.role,session?.permissions.join('|'),type,from,to],enabled:!isMock,queryFn:({signal})=>apiRequest<{items:Row[];total:string|number}>(`/api/reports/${type}?dateFrom=${from}&dateTo=${to}`,{signal})});
 if(!data)return null;
 const within=(d?:string|null)=>!!d&&d.slice(0,10)>=from&&d.slice(0,10)<=to;
 const demo:Row[]=type==='revenue'?data.Payments.filter(p=>p.status==='Completed'&&within(p.paidAt)).map(p=>({label:`${date(p.paidAt)} · ${lookup('memberId',p.memberId,data)}`,value:p.amount})):
 type==='members'?data.Members.filter(m=>within(m.joinDate)).map(m=>({label:lookup('memberId',m.memberId,data),value:1})):
 type==='packages'?data.MemberPackages.filter(p=>within(p.startDate)).map(p=>({label:`${lookup('memberId',p.memberId,data)} · ${lookup('packageId',p.packageId,data)}`,value:p.price})):
 type==='checkins'?data.CheckIns.filter(c=>within(c.checkInTime)).map(c=>({label:`${date(c.checkInTime,true)} · ${lookup('memberId',c.memberId,data)}`,value:1})):
 data.MaintenanceRecords.filter(m=>within(m.maintenanceDate)).map(m=>({label:`${date(m.maintenanceDate)} · ${lookup('equipmentId',m.equipmentId,data)}`,value:m.cost??'0'}));
 const rows=isMock?demo:(report.data?.items??[]),total=isMock?decimalSum(demo.map(r=>r.value)):(report.data?.total??'0'),financial=['revenue','packages','maintenance'].includes(type);
 function exportCsv(){const safe=(v:string|number)=>{const raw=String(v);return `"${(/^[=+@-]/.test(raw)?"'":"")+raw.replaceAll('"','""')}"`;};const csv='\uFEFF'+[['GYM HUNG',type,from,to],['Chi tiết',financial?'VND':'Số lượt'],...rows.map(r=>[r.label,r.value]),['Tổng',total]].map(r=>r.map(safe).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`GYM-HUNG-${type}-${from}-${to}.csv`;a.click();URL.revokeObjectURL(url);}
 return <><PageHeading eyebrow="GYM HUNG · BÁO CÁO" title="Báo cáo hoạt động" description="Báo cáo theo kỳ và xuất CSV tiếng Việt."><Button onClick={exportCsv} disabled={!isMock&&!report.data}><Download size={16}/>Xuất CSV</Button></PageHeading><section className="panel"><div className="date-filters" style={{padding:16}}><label>Loại báo cáo<NativeSelect value={type} onChange={e=>setType(e.target.value)}>{choices.map(([v,l])=><NativeSelectOption key={v} value={v}>{l.title}</NativeSelectOption>)}</NativeSelect></label><label htmlFor="reports-from">Từ ngày<Input id="reports-from" type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label htmlFor="reports-to">Đến ngày<Input id="reports-to" type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label></div>
 {!isMock&&report.isPending?<Loading/>:!isMock&&report.error?<ErrorState message={errorText(report.error)} retry={()=>void report.refetch()}/>:<><div className="summary-row"><div><span>Tổng trong kỳ<strong>{financial?money(total):total}</strong></span></div></div><div style={{maxHeight:520,overflow:'auto'}}>{rows.map((r,i)=><div className="person-row" key={i}><span className="person-name">{r.label}</span><strong>{financial?money(r.value):r.value}</strong></div>)}{!rows.length&&<p className="inline-empty">Không có dữ liệu trong kỳ.</p>}</div></>}</section><p className="muted" style={{marginTop:16}}>Doanh thu chỉ tính Payments Completed theo PaidAt; không cộng giao dịch nhà cung cấp. Gói tập theo ngày bắt đầu, bảo trì theo ngày bảo trì.</p></>;
}
