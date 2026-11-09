import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import Link from '@/src/routes/link';
import {Users,Wallet,ScanLine,CalendarDays,HeartPulse,Package,Plus} from 'lucide-react';
import {useApp} from '@/src/app/provider';
import {can} from '@/src/app/permissions';
import {isMock} from '@/src/api/service';
import {apiRequest} from '@/src/api/production';
import {PageHeading,SectionHead,Loading,ErrorState,Badge} from '@/src/components/common';
import {TrendChart} from '@/src/components/charts';
import {Input} from '@/components/ui/input';
import {money,decimalSum,localDate,date,offsetDate} from '@/src/utils/format';
import {lookup} from '@/src/features/resources/config';
import {errorText} from '@/src/api/client';
interface Aggregate {totals:{members:number;activeMembers:number;newMembers:number;revenue:string;periodCheckins:number;todaySchedules:number;expiringPackages:number;highRiskMembers:number};revenue:{date:string;amount:string}[];checkins:{date:string;count:number}[];members?:{date:string;count:number}[];packages:{name:string;count:number}[];recentPayments?:unknown[]}
export function Dashboard(){
 const {data,session}=useApp();
 const [from,setFrom]=useState(offsetDate(-30)),[to,setTo]=useState(localDate());
 const aggregate=useQuery({queryKey:['dashboard',session?.userId,session?.role,session?.permissions.join('|'),from,to],enabled:!isMock,queryFn:({signal})=>apiRequest<Aggregate>(`/api/dashboard?dateFrom=${from}&dateTo=${to}`,{signal})});
 if(!data)return null;
 if(!isMock && aggregate.isPending)return <Loading/>;
 if(!isMock && aggregate.error)return <ErrorState message={errorText(aggregate.error)} retry={()=>void aggregate.refetch()}/>;
 const within=(value?:string|null)=>!!value&&value.slice(0,10)>=from&&value.slice(0,10)<=to;
 const latest=[...new Map(data.ChurnPredictions.toSorted((a,b)=>b.predictionDate.localeCompare(a.predictionDate)).map(x=>[x.memberId,x] as const).reverse()).values()];
 const expiring=data.MemberPackages.filter(p=>p.status==='Active'&&p.endDate&&p.endDate>=localDate()&&p.endDate<=offsetDate(7));
 const high=latest.filter(p=>p.riskLevel==='High');
 const schedules=data.WorkoutSchedules.filter(s=>s.scheduleDate===localDate()&&s.status!=='Canceled').toSorted((a,b)=>a.startTime.localeCompare(b.startTime));
 const payments=data.Payments.filter(p=>p.status==='Completed'&&within(p.paidAt));
 const group=new Map<string,string[]>();for(const p of payments){const d=p.paidAt!.slice(0,10);group.set(d,[...(group.get(d)??[]),String(p.amount)]);}
 const counts=new Map<string,number>();for(const c of data.CheckIns.filter(c=>within(c.checkInTime))){const d=c.checkInTime.slice(0,10);counts.set(d,(counts.get(d)??0)+1);}
 const demo:Aggregate={totals:{members:data.Members.length,activeMembers:data.Members.filter(m=>m.status==='Active').length,newMembers:data.Members.filter(m=>within(m.joinDate)).length,revenue:decimalSum(payments.map(p=>p.amount)),periodCheckins:[...counts.values()].reduce((a,b)=>a+b,0),todaySchedules:schedules.length,expiringPackages:expiring.length,highRiskMembers:high.length},revenue:[...group].sort(([a],[b])=>a.localeCompare(b)).map(([date,v])=>({date,amount:decimalSum(v)})),checkins:[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count})),packages:data.Packages.map(p=>({name:p.packageName,count:data.MemberPackages.filter(m=>m.packageId===p.packageId&&m.status==='Active').length}))};
 const summary=isMock?demo:aggregate.data!;
 const stats=[{label:'Tổng hội viên',value:summary.totals.members,hint:`${summary.totals.activeMembers} đang hoạt động`,icon:Users,path:'/members'},{label:'Doanh thu đã thu',value:money(summary.totals.revenue),hint:'Chỉ Payments hoàn tất trong kỳ',icon:Wallet,path:'/payments',permission:'payments.read'},{label:'Check-in trong kỳ',value:summary.totals.periodCheckins,hint:'Lượt vào phòng gym',icon:ScanLine,path:'/checkins',permission:'checkins.read'},{label:'Buổi tập hôm nay',value:summary.totals.todaySchedules,hint:date(localDate()),icon:CalendarDays,path:'/schedules'},{label:'Gói hết hạn trong 7 ngày',value:summary.totals.expiringPackages,hint:'Gói còn hiệu lực',icon:Package,path:'/packages',permission:'packages.read'},{label:'Nguy cơ rời bỏ cao',value:summary.totals.highRiskMembers,hint:'Dự báo mới nhất của mỗi hội viên',icon:HeartPulse,path:'/churn',permission:'churn.read'}];
 return <><PageHeading eyebrow="GYM HUNG · KHÔNG GIAN ĐIỀU HÀNH" title="Tổng quan phòng tập" description={`Chào ${session?.fullName}, theo dõi hoạt động và chăm sóc hội viên.`}>{can(session,'members.write')&&<Link className="button-primary" href="/members?new=1"><Plus size={16}/>Thêm hội viên</Link>}</PageHeading>
 <section className="panel date-filters" style={{padding:16,marginBottom:20}}><label htmlFor="dashboard-from">Từ ngày<Input id="dashboard-from" type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label htmlFor="dashboard-to">Đến ngày<Input id="dashboard-to" type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label><p className="muted">{isMock?'Số liệu từ dữ liệu demo':'Số liệu tổng hợp trực tiếp từ SQL Server'}</p></section>
 <div className="stats-grid">{stats.filter(s=>!s.permission||can(session,s.permission)).map((s,i)=><Link key={s.label} href={s.path} className={`stat-card ${i===0?'featured':''}`}><div className="stat-top"><span>{s.label}</span><s.icon size={20}/></div><strong>{s.value??'—'}</strong><div className="stat-foot">{s.hint}</div></Link>)}</div>
 <div className="two-column-grid">{can(session,'payments.read')&&<section className="panel"><SectionHead title="Doanh thu theo ngày" description="Triệu VND · Biểu đồ làm tròn để hiển thị"/><TrendChart data={summary.revenue.map(p=>({name:date(p.date).slice(0,5),value:Number(p.amount)/1e6}))} label="Doanh thu đã thu trong kỳ"/></section>}<section className="panel"><SectionHead title="Lượt vào phòng gym" description="Nguồn CheckIns, tách biệt điểm danh lớp"/><TrendChart kind="bar" data={summary.checkins.map(p=>({name:date(p.date).slice(0,5),value:p.count}))} label="Check-in trong kỳ"/></section></div>
 {can(session,'packages.read')&&<section className="panel" style={{margin:'20px 0'}}><SectionHead title="Phân bố gói tập đang hoạt động"/><TrendChart kind="bar" data={summary.packages.map(p=>({name:p.name,value:p.count}))} label="Phân bố gói tập"/></section>}
 <div className="two-column-grid"><section className="panel"><SectionHead title="Lịch tập hôm nay" href="/schedules"/>{schedules.length?schedules.map(s=><div className="person-row" key={s.workoutScheduleId}><strong>{s.startTime.slice(0,5)}–{s.endTime.slice(0,5)}</strong><span className="person-name"><strong>{s.title}</strong><small>{lookup('trainerId',s.trainerId,data)} · {lookup('roomId',s.roomId,data)}</small></span><Badge value={s.status}/></div>):<p className="inline-empty">Chưa có buổi tập hôm nay.</p>}</section>
 {can(session,'payments.read')&&<section className="panel"><SectionHead title="Thanh toán gần đây trong kỳ" href="/payments"/>{payments.toSorted((a,b)=>(b.paidAt??'').localeCompare(a.paidAt??'')).slice(0,5).map(p=><div className="person-row" key={p.paymentId}><span className="person-name"><strong>{lookup('memberId',p.memberId,data)}</strong><small>{date(p.paidAt)}</small></span><strong>{money(p.amount)}</strong></div>)}{!payments.length&&<p className="inline-empty">Chưa có thanh toán hoàn tất trong kỳ.</p>}</section>}</div>
 <div className="two-column-grid" style={{marginTop:20}}>{can(session,'packages.read')&&<section className="panel"><SectionHead title="Gói sắp hết hạn" href="/packages"/>{expiring.map(p=><div className="person-row" key={p.memberPackageId}><span className="person-name"><strong>{lookup('memberId',p.memberId,data)}</strong><small>{lookup('packageId',p.packageId,data)}</small></span><strong>{date(p.endDate)}</strong></div>)}{!expiring.length&&<p className="inline-empty">Không có gói sắp hết hạn trong 7 ngày.</p>}</section>}{can(session,'churn.read')&&<section className="panel"><SectionHead title="Hội viên cần chăm sóc" href="/churn"/>{high.map(p=><Link href={`/members/${p.memberId}`} className="person-row" key={p.memberId}><span className="person-name"><strong>{lookup('memberId',p.memberId,data)}</strong><small>{p.recommendedActions}</small></span><Badge value={p.riskLevel}/></Link>)}{!high.length&&<p className="inline-empty">Chưa có hội viên thuộc nhóm rủi ro cao.</p>}</section>}</div>
 </>;
}
