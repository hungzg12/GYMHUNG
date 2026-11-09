import {beforeEach,describe,expect,it,vi} from 'vitest';
import {productionService,apiRequest} from '@/src/api/production';
import {decimalSum,date,money} from '@/src/utils/format';
import {validate,bookingError} from '@/src/features/resources/validation';
import {initialDraft} from '@/src/features/resources/entity-form';
const session={userId:'9223372036854775807',fullName:'Hội viên kiểm thử',role:'Member',permissions:['profile.read'],memberId:'9007199254740993'};
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
describe('Production REST integration',()=>{
 it('trims account identifiers but preserves the password exactly',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(response({...session,token:'test-access'})).mockResolvedValueOnce(response(session));vi.stubGlobal('fetch',fetch);
 await productionService.login('  demo.member0  ',' password with spaces ');
 expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({username:'demo.member0',password:' password with spaces '});
 });
 it('updates only status and notes on immutable member package purchase history',async()=>{
 const fetch=vi.fn().mockImplementation(async()=>response({memberPackageId:'1'}));vi.stubGlobal('fetch',fetch);
 await productionService.save('MemberPackages','1',{memberPackageId:'1',memberId:'40',packageId:'2',startDate:'2026-10-05',endDate:'2026-11-04',price:'590000',remainingSessions:20,status:'Canceled',notes:'Theo yêu cầu hội viên',createdAt:'2026-10-05T08:00:00'} as never);
 expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({draft:{status:'Canceled',notes:'Theo yêu cầu hội viên'}});
 });
 it('omits generated ownership and system fields from composite member creation while retaining password and real foreign keys',async()=>{
 const fetch=vi.fn().mockImplementation(async()=>response({memberId:'1'}));vi.stubGlobal('fetch',fetch);
 await productionService.save('Members',null,{...initialDraft('Members'),memberId:'99',userId:'',goal:'Tăng cơ',createdAt:'2026-01-01'} as never,{...initialDraft('Users'),userId:'88',username:'new.member',fullName:'Hội viên mới',email:'new@example.com',password:'GymHung@2026',createdAt:'2026-01-01'} as never);
 const payload=JSON.parse(fetch.mock.calls[0][1].body);
 expect(payload.draft).not.toHaveProperty('userId');expect(payload.draft).not.toHaveProperty('memberId');expect(payload.draft).not.toHaveProperty('createdAt');
 expect(payload.userDraft).not.toHaveProperty('userId');expect(payload.userDraft).not.toHaveProperty('createdAt');expect(payload.userDraft.password).toBe('GymHung@2026');
 await productionService.save('MemberPackages',null,{memberId:'9007199254740993',packageId:'1',price:'590000'});
 expect(JSON.parse(fetch.mock.calls[1][1].body).draft).toMatchObject({memberId:'9007199254740993',packageId:'1',price:'590000'});
 });
 beforeEach(async()=>{vi.unstubAllGlobals();await productionService.logout();localStorage.clear();});
 it('keeps access tokens only in memory and verifies session through authenticated me',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(response({...session,token:'test-access'})).mockResolvedValueOnce(response(session)).mockResolvedValueOnce(response(session));vi.stubGlobal('fetch',fetch);
 expect(await productionService.login('demo.member','test')).toMatchObject(session);
 expect(await productionService.session()).toMatchObject(session);
 expect(fetch.mock.calls[1][0]).toContain('/api/auth/me');expect(fetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer test-access');expect(localStorage.length).toBe(0);
 await productionService.logout();expect(await productionService.session()).toBeNull();
 });
 it('rejects malformed me instead of trusting a client login role',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(response({...session,token:'test-access'})).mockResolvedValueOnce(response({...session,userId:42})));await expect(productionService.login('x','x')).rejects.toThrow();expect(await productionService.session()).toBeNull();});
 it('preserves BIGINT identifiers and exact DECIMAL money while mapping visual measurements',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response({Packages:[{packageId:'9007199254740993',price:'999999999999999.1234'}],Members:[{memberId:'9007199254740994',height:'170.25'}]})));
 const data=await productionService.load();expect(data.Packages[0].packageId).toBe('9007199254740993');expect(data.Packages[0].price).toBe('999999999999999.1234');expect(data.Members[0].height).toBe(170.25);
 expect(decimalSum(['999999999999999.1234','0.0001'])).toBe('999999999999999.1235');expect(money('999999999999999.1234')).toBe('999.999.999.999.999 ₫');
 });
 it('sends composite user draft and decimal form values without rounding',async()=>{const fetch=vi.fn().mockImplementation(async()=>response({memberId:'1'}));vi.stubGlobal('fetch',fetch);await productionService.save('Members',null,{goal:'Tăng cơ'},{fullName:'Hội viên mới',email:'new@example.com'});expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({draft:{goal:'Tăng cơ'},userDraft:{fullName:'Hội viên mới',email:'new@example.com'}});await productionService.save('Payments',null,{amount:'999999999999999.1234'});expect(JSON.parse(fetch.mock.calls[1][1].body).draft.amount).toBe('999999999999999.1234');});
 it('keeps API resource filter paging and dashboard/report dates in the request',async()=>{const fetch=vi.fn().mockImplementation(async()=>response({items:[],totalCount:0}));vi.stubGlobal('fetch',fetch);await apiRequest('/api/resources/Members?page=2&pageSize=8&search=An&status=Active');await apiRequest('/api/dashboard?dateFrom=2026-10-01&dateTo=2026-10-05');await apiRequest('/api/reports/revenue?dateFrom=2026-10-01&dateTo=2026-10-05');expect(fetch.mock.calls.map(c=>c[0])).toEqual(expect.arrayContaining([expect.stringContaining('page=2&pageSize=8'),expect.stringContaining('/api/dashboard?dateFrom=2026-10-01'),expect.stringContaining('/api/reports/revenue?dateFrom=2026-10-01')]));});
 it('surfaces a conflict with field errors and never falls back to mock',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response({detail:'Buổi tập đã đủ chỗ.',errors:{capacity:['Đã đầy.']}},409)));await expect(productionService.save('Bookings',null,{memberId:'1',workoutScheduleId:'1'})).rejects.toMatchObject({status:409,message:'Buổi tập đã đủ chỗ.',fieldErrors:{capacity:'Đã đầy.'}});expect(localStorage.length).toBe(0);});
 it('handles SQL nullable capacity, exact decimal strings and Vietnam wall-clock dates',()=>{expect(bookingError({status:'Available',capacity:null,currentParticipants:200,scheduleDate:'2099-10-01',endTime:'12:00'})).toBeNull();expect(validate('Payments',{memberId:'1',memberPackageId:'1',amount:'999999999999999.1234',status:'Pending'})).not.toHaveProperty('amount');expect(date('2026-10-05T23:30:00',true)).toBe('05/10/2026 23:30');});
});
