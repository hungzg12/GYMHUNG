import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {apiRequest} from '@/src/api/production';
import {errorText} from '@/src/api/client';
import {useApp} from "@/src/app/provider";
import {isMock} from '@/src/api/service';
const schema=z.object({currentPassword:z.string().min(1,'Nhập mật khẩu hiện tại.'),newPassword:z.string().min(8,'Mật khẩu tối thiểu 8 ký tự.'),confirmPassword:z.string()}).refine(v=>v.newPassword===v.confirmPassword,{path:['confirmPassword'],message:'Mật khẩu xác nhận chưa khớp.'});
export function PasswordForm(){const {logout}=useApp();const [notice,setNotice]=useState('');const form=useForm<z.infer<typeof schema>>({resolver:zodResolver(schema)});return <form className="panel" style={{padding:24,marginTop:24,maxWidth:720}} onSubmit={form.handleSubmit(async values=>{setNotice('');try{await apiRequest('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword:values.currentPassword,newPassword:values.newPassword})});setNotice('Đã đổi mật khẩu thành công.');form.reset();await logout();}catch(e){setNotice(errorText(e));}})}><h2 style={{marginBottom:16}}>Đổi mật khẩu</h2>{isMock?<p className="notice-box">Đổi mật khẩu chỉ hỗ trợ khi kết nối API thật. Demo không lưu mật khẩu trong trình duyệt.</p>:<><div className="form-grid">{Object.entries({currentPassword:'Mật khẩu hiện tại',newPassword:'Mật khẩu mới',confirmPassword:'Xác nhận mật khẩu mới'}).map(([key,label])=><label key={key} className="field">{label}<Input type="password" autoComplete={key==='currentPassword'?'current-password':'new-password'} {...form.register(key as keyof z.infer<typeof schema>)} aria-invalid={!!form.formState.errors[key as keyof z.infer<typeof schema>]}/>{form.formState.errors[key as keyof z.infer<typeof schema>]&&<span className="field-error">{form.formState.errors[key as keyof z.infer<typeof schema>]?.message}</span>}</label>)}</div><div className="form-footer"><Button type="submit" loading={form.formState.isSubmitting}>Đổi mật khẩu</Button></div></>}{notice&&<output>{notice}</output>}</form>}
