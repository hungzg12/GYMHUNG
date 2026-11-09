import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {AppProvider,useApp} from '@/src/app/provider';
import type {Session} from '@/src/app/permissions';
const mock=vi.hoisted(()=>({current:null as Session|null}));
vi.mock('@/src/api/service',()=>({getService:async()=>({session:async()=>mock.current,logout:async()=>{mock.current=null;},login:async(name:string)=>{mock.current={userId:name==='admin'?'1':'2',fullName:name,role:name==='admin'?'Admin':'Member',permissions:['members.read']};return mock.current;},load:async()=>({Members:[{memberId:mock.current?.role==='Admin'?'admin-private-member':'own-member'}]})})}));
function Harness(){const {login,logout,data,session,checking}=useApp();return <><button onClick={()=>void login('admin','x')}>Admin login</button><button onClick={()=>void logout()}>Logout</button><button onClick={()=>void login('member','x')}>Member login</button><p>{checking?'checking':session?.role??'logged-out'}</p>{data?.Members.map(m=><p key={m.memberId}>{m.memberId}</p>)}</>;}
describe('Query cache authorization scope',()=>{it('clears prior admin workspace before login as member',async()=>{mock.current=null;render(<AppProvider><Harness/></AppProvider>);await screen.findByText('logged-out');fireEvent.click(screen.getByText('Admin login'));expect(await screen.findByText('admin-private-member')).toBeVisible();fireEvent.click(screen.getByText('Logout'));await screen.findByText('logged-out');expect(screen.queryByText('admin-private-member')).not.toBeInTheDocument();fireEvent.click(screen.getByText('Member login'));expect(await screen.findByText('own-member')).toBeVisible();expect(screen.queryByText('admin-private-member')).not.toBeInTheDocument();});});

