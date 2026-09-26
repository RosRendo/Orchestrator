# Developer Guide: How to Add a New Router Page & Backend API Route

Follow this step-by-step guide to add your next custom tab (e.g. `myapi`) with its own frontend viewport and backend endpoints.

---

## 🛠️ Step 1: Add Endpoint in Backend

1. Open [`backend/src/automation.controller.ts`](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Orchestrator/backend/src/automation.controller.ts) or create a new NestJS Controller.
2. Add your HTTP endpoint handlers. Example:
   ```typescript
   @Get('myapi/data')
   getMyApiData(@Res() res: any) {
     try {
       // Return data payload
       res.json({ ok: true, data: ['Value 1', 'Value 2'] });
     } catch (e: any) {
       res.status(500).json({ ok: false, error: e.message });
     }
   }

   @Post('myapi/action')
   triggerMyApiAction(@Body() body: { param: string }, @Res() res: any) {
     // Perform operations
     res.json({ ok: true, status: `Triggered with: ${body.param}` });
   }
   ```
3. The NestJS hot-reload server will automatically detect and map these paths to `http://localhost:3005/automation/myapi/data`.

---

## 🛠️ Step 2: Add Navigation Link in Sidebar

1. Open [`frontend/src/app/page.tsx`](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Orchestrator/frontend/src/app/page.tsx).
2. Locate the sidebar scrollable tab list (inside `Dashboard()` render, near `<aside>`).
3. Add a new clickable `div` block matching the style guidelines:
   ```typescript
   {/* My Custom API Tab */}
   <div
     onClick={() => setActiveTab('myapi')}
     className={`sidebar-item ${activeTab === 'myapi' ? 'active' : ''}`}
   >
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
       {/* Use a fitting SVG icon */}
       <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
       <line x1="7" y1="2" x2="7" y2="22" />
     </svg>
     <span className="sidebar-item-label">My Custom API</span>
   </div>
   ```

---

## 🛠️ Step 3: Create the Viewport Component

1. Define a React component in `frontend/src/app/page.tsx` (or a separate file under `src/components/` and import it).
2. Example component outline with stateful fetches:
   ```typescript
   const MyApiView = ({ backendUrl }: { backendUrl: string }) => {
     const [data, setData] = useState<string[]>([]);
     const [loading, setLoading] = useState(true);

     const fetchData = async () => {
       try {
         const res = await fetch(`${backendUrl}/automation/myapi/data`);
         const json = await res.json();
         if (json.ok) setData(json.data);
       } catch (err) {
         console.error('Failed to load MyAPI data:', err);
       }
       setLoading(false);
     };

     useEffect(() => {
       fetchData();
     }, []);

     return (
       <div style={{ padding: '24px' }} className="animate-fade-in">
         <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px' }}>My Custom API Router</h2>
         {loading ? (
           <p style={{ color: 'rgba(255,255,255,0.4)' }}>Fetching data...</p>
         ) : (
           <ul>
             {data.map((item, idx) => (
               <li key={idx} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{item}</li>
             ))}
           </ul>
         )}
       </div>
     );
   };
   ```

---

## 🛠️ Step 4: Map Tab in Workspace Switcher

1. Scroll to the main page tab rendering condition switch block (around lines 3650–3750).
2. Map your new tab key to display the view:
   ```typescript
   ) : activeTab === 'myapi' ? (
     <MyApiView backendUrl={BACKEND_URL} />
   ```
3. Your Next.js workspace will hot-reload, and your new tab route will be live!
