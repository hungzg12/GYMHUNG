import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/app/provider';
import { lookup } from './config';
import { date, money } from '@/src/utils/format';

export function Receipts() {
  const { data } = useApp();
  if (!data) return null;
  const payments = data.Payments.filter(payment => payment.status === 'Completed')
    .toSorted((a,b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''));
  function download(id: string, print = false) {
    if (!data) return;
    const payment = data.Payments.find(row => row.paymentId === id && row.status === 'Completed');
    if (!payment) return;
    const subscription = data.MemberPackages.find(row => row.memberPackageId === payment.memberPackageId);
    const text = [
      'GYM HUNG - BIÊN NHẬN THU TIỀN',
      `Số biên nhận: PT-${payment.paymentId}`,
      `Hội viên: ${lookup('memberId',payment.memberId,data)}`,
      `Gói tập: ${subscription ? lookup('packageId',subscription.packageId,data) : '—'}`,
      `Số tiền: ${money(payment.amount)}`,
      `Ngày thu: ${date(payment.paidAt,true)}`,
      `Phương thức: ${payment.paymentMethod ?? '—'}`,
      `Mã giao dịch: ${payment.transactionCode ?? '—'}`,
      'Trạng thái: Đã thu',
      'Biên nhận thu tiền nội bộ; không thay thế hóa đơn điện tử.',
    ].join('\r\n');
    if (print) {
      const preview = window.open('', '_blank', 'width=800,height=800');
      if (!preview) return;
      preview.document.title = `Biên nhận PT-${payment.paymentId}`;
      preview.document.documentElement.lang = 'vi';
      const style = preview.document.createElement('style');
      style.textContent = '@page{size:A4;margin:22mm}body{font-family:Arial,sans-serif;color:#172630;padding:28px}h1{font-size:26px;border-bottom:3px solid #009b78;padding-bottom:18px}pre{font:16px/2 Arial,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere}button{padding:12px 20px;border:0;border-radius:6px;background:#009b78;color:white;cursor:pointer}@media print{button{display:none}body{padding:0}}';
      preview.document.head.append(style);
      const title = preview.document.createElement('h1');
      title.textContent = 'GYMHUNG';
      const content = preview.document.createElement('pre');
      content.textContent = text;
      const printButton = preview.document.createElement('button');
      printButton.textContent = 'In / Lưu PDF';
      printButton.onclick = () => preview.print();
      preview.document.body.append(title,content,printButton);
      return;
    }
    const url = URL.createObjectURL(new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href=url;
    link.download=`Bien-nhan-PT-${payment.paymentId}.txt`;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section aria-label="Biên nhận thanh toán">
    {payments.length === 0 && <p className="inline-empty">Chưa có khoản thu hoàn tất.</p>}
    {payments.map(payment => <div className="person-row" key={payment.paymentId}>
      <div><strong>PT-{payment.paymentId} · {lookup('memberId',payment.memberId,data)}</strong><p>{date(payment.paidAt,true)} · {money(payment.amount)}</p></div>
      <Button variant="outline" onClick={()=>download(payment.paymentId)} aria-label={`Tải biên nhận PT-${payment.paymentId}`}><Download size={16}/>Tải biên nhận</Button>
      <Button variant="outline" onClick={()=>download(payment.paymentId,true)} aria-label={`In hoặc lưu PDF biên nhận PT-${payment.paymentId}`}><Printer size={16}/>In / PDF</Button>
    </div>)}
  </section>;
}
