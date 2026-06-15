const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Let's register newMBloodGroup & editMBloodGroup state declarations
content = content.replace(
  "  const [newMDob, setNewMDob] = useState('');",
  "  const [newMDob, setNewMDob] = useState('');\n  const [newMBloodGroup, setNewMBloodGroup] = useState('');"
);
content = content.replace(
  "  const [editMDob, setEditMDob] = useState('');",
  "  const [editMDob, setEditMDob] = useState('');\n  const [editMBloodGroup, setEditMBloodGroup] = useState('');"
);

// 2. Clear out the corrupted, broken block in leaders section by looking for its start and end
const startMarker = "const handleSaveFormer = async (newList: any[]) => {\n                    setIsSavingLeaders(true);\n                    await onSaveSettings({ leadersFormer: newList });\n                    setIsSavingLeaders(false);\n                  };\n\n                  return (";

const endMarker = "                      <label className=\"block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1\">শিক্ষাবর্ষ বা সেশন</label>";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("COULD NOT FIND THE MARKERS!", { startIndex, endIndex });
  process.exit(1);
}

const beforePart = content.substring(0, startIndex + startMarker.length);
const afterPart = content.substring(endIndex);

// Reconstruct the whole block beautifully between return ( ... and শিক্ষাবর্ষ বা সেশন
const middlePart = `
                    <div className="space-y-4">
                      {/* Sub tab navigator */}
                      <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        {[
                          { id: 'district', label: 'জেলা সংসদ' },
                          { id: 'executive', label: 'কার্যকরী সদস্য' },
                          { id: 'units', label: 'শিক্ষাঙ্গন ও স্কুল ফোরাম' },
                          { id: 'former', label: 'সাবেক ছাত্রনেতৃত্ব' }
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setLeadersSubTab(sub.id as any)}
                            className={\`px-3 py-1.5 rounded text-xs font-bold leading-none cursor-pointer transition-all \${
                              leadersSubTab === sub.id
                                ? 'bg-rose-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-850'
                            }\`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      {/* District Committee Section */}
                      {leadersSubTab === 'district' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded bg-white dark:bg-zinc-955">
                            {(db.settings.leadersDistrict || []).map((leader: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded border border-zinc-100 dark:border-zinc-855">
                                <div className="text-xs">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{leader.name}</span>
                                  {leader.role && <span className="text-rose-650 dark:text-rose-455 text-[10px] ml-2 font-semibold">({leader.role})</span>}
                                  {leader.inst && <span className="text-zinc-500 text-[10px] ml-2 block sm:inline">• {leader.inst}</span>}
                                  {leader.memberCode && <span className="text-[10px] text-zinc-400 font-mono ml-2 block sm:inline">[কোড: {leader.memberCode}]</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (db.settings.leadersDistrict || []).filter((_: any, i: number) => i !== idx);
                                    handleSaveDistrict(updated);
                                  }}
                                  disabled={isSavingLeaders}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-805 rounded bg-white dark:bg-zinc-955 space-y-3">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455">নতুন জেলা সংসদ নেতা যুক্ত করুন</h5>
                            
                            {/* Autocomplete Member Search Linker */}
                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded text-xs space-y-1.5 font-sans">
                              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">সংগঠনের সদস্য তালিকায় খুঁজুন ও লিঙ্ক করুন (আইডি বা নাম)</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="অনুমোদিত সদস্যের নাম বা আইডি কোড লিখে খুঁজুন..."
                                  className="w-full text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-white dark:bg-zinc-955 text-zinc-955 dark:text-white"
                                  value={leaderSearchText}
                                  onChange={(e) => setLeaderSearchText(e.target.value)}
                                />
                                {leaderSearchText && (
                                  <div className="absolute z-20 top-full inset-x-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-xs">
                                    {db.memberships
                                      .filter(m => m.status === 'verified' && (
                                        m.name.toLowerCase().includes(leaderSearchText.toLowerCase()) || 
                                        m.id.toLowerCase().includes(leaderSearchText.toLowerCase())
                                      ))
                                      .map(m => {
                                        const cleanId = \`SSF-MYM-\${m.id.substring(m.id.length - 5).toUpperCase()}\`;
                                        return (
                                          <button
                                            type="button"
                                            key={m.id}
                                            onClick={() => {
                                              setDName(m.name);
                                              setDMemberCode(cleanId);
                                              setDPhotoUrl(m.photoUrl || '');
                                              setDInst(m.institution || '');
                                              setLeaderSearchText('');
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-955/20 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 cursor-pointer block"
                                          >
                                            <div className="font-bold text-zinc-850 dark:text-zinc-200">{m.name}</div>
                                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{cleanId} • {m.institution}</div>
                                          </button>
                                        );
                                      })}
                                    {db.memberships.filter(m => m.status === 'verified' && (m.name.toLowerCase().includes(leaderSearchText.toLowerCase()) || m.id.toLowerCase().includes(leaderSearchText.toLowerCase()))).length === 0 && (
                                      <div className="p-3 text-zinc-400 dark:text-zinc-500 italic text-center">কোড বা নামে কোনো অনুমোদিত সদস্য মিলল না।</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="নেতার নাম"
                                value={dName}
                                onChange={(e) => setDName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="পদবী (যেমনঃ সভাপতি)"
                                value={dRole}
                                onChange={(e) => setDRole(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="প্রতিষ্ঠান (যেমনঃ আনন্দ মোহন কলেজ)"
                                value={dInst}
                                onChange={(e) => setDInst(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-150 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white font-mono"
                                placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                value={dMemberCode}
                                onChange={(e) => setDMemberCode(e.target.value)}
                              />
                            </div>

                            <FileUploader
                              label="সদস্যের ছবি আপলোড করুন বা সরাসরি লিঙ্ক দিন (ঐচ্ছিক):"
                              value={dPhotoUrl}
                              onChange={(url) => setDPhotoUrl(url)}
                              placeholder="ছবির সরাসরি লিঙ্ক (URL) অথবা ফাইল"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                if (!dName || !dRole) return;
                                const updated = [...(db.settings.leadersDistrict || []), {
                                  name: dName,
                                  role: dRole,
                                  inst: dInst || null,
                                  memberCode: dMemberCode || null,
                                  photoUrl: dPhotoUrl || null
                                }];
                                handleSaveDistrict(updated);
                                setDName('');
                                setDRole('');
                                setDInst('');
                                setDMemberCode('');
                                setDPhotoUrl('');
                              }}
                              disabled={isSavingLeaders || !dName || !dRole}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Executive Committee Section */}
                      {leadersSubTab === 'executive' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded bg-white dark:bg-zinc-955">
                            {(db.settings.leadersExecutive || []).map((leader: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded border border-zinc-100 dark:border-zinc-850">
                                <div className="text-xs">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{leader.name}</span>
                                  {leader.role && <span className="text-rose-650 dark:text-rose-455 text-[10px] ml-2 font-semibold">({leader.role})</span>}
                                  {leader.inst && <span className="text-zinc-500 text-[10px] ml-2 block sm:inline">• {leader.inst}</span>}
                                  {leader.memberCode && <span className="text-[10px] text-zinc-400 font-mono ml-2 block sm:inline">[কোড: {leader.memberCode}]</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (db.settings.leadersExecutive || []).filter((_: any, i: number) => i !== idx);
                                    handleSaveExecutive(updated);
                                  }}
                                  disabled={isSavingLeaders}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-808 rounded bg-white dark:bg-zinc-955 space-y-3 font-sans">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455">নতুন কার্যকরী সদস্য যুক্ত করুন</h5>

                            {/* Autocomplete Member Search Linker */}
                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded text-xs space-y-1.5 font-sans">
                              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">সংগঠনের সদস্য তালিকায় খুঁজুন ও লিঙ্ক করুন (আইডি বা নাম)</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="অনুমোদিত সদস্যের নাম বা আইডি কোড লিখে খুঁজুন..."
                                  className="w-full text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-white dark:bg-zinc-950 text-zinc-955 dark:text-white"
                                  value={executiveLeaderSearchText}
                                  onChange={(e) => setExecutiveLeaderSearchText(e.target.value)}
                                />
                                {executiveLeaderSearchText && (
                                  <div className="absolute z-20 top-full inset-x-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-xs">
                                    {db.memberships
                                      .filter(m => m.status === 'verified' && (
                                        m.name.toLowerCase().includes(executiveLeaderSearchText.toLowerCase()) || 
                                        m.id.toLowerCase().includes(executiveLeaderSearchText.toLowerCase())
                                      ))
                                      .map(m => {
                                        const cleanId = \`SSF-MYM-\${m.id.substring(m.id.length - 5).toUpperCase()}\`;
                                        return (
                                          <button
                                            type="button"
                                            key={m.id}
                                            onClick={() => {
                                              setEName(m.name);
                                              setEMemberCode(cleanId);
                                              setEPhotoUrl(m.photoUrl || '');
                                              setEInst(m.institution || '');
                                              setExecutiveLeaderSearchText('');
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-955/20 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 cursor-pointer block"
                                          >
                                            <div className="font-bold text-zinc-850 dark:text-zinc-200">{m.name}</div>
                                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{cleanId} • {m.institution}</div>
                                          </button>
                                        );
                                      })}
                                    {db.memberships.filter(m => m.status === 'verified' && (m.name.toLowerCase().includes(executiveLeaderSearchText.toLowerCase()) || m.id.toLowerCase().includes(executiveLeaderSearchText.toLowerCase()))).length === 0 && (
                                      <div className="p-3 text-zinc-400 dark:text-zinc-500 italic text-center">কোড বা নামে কোনো অনুমোদিত সদস্য মিলল না।</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-sans">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="সদস্যের নাম"
                                value={eName}
                                onChange={(e) => setEName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="পদবী (যেমনঃ কার্যকরী সদস্য)"
                                value={eRole}
                                onChange={(e) => setERole(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="শিক্ষা প্রতিষ্ঠান (যেমনঃ আনন্দ মোহন কলেজ)"
                                value={eInst}
                                onChange={(e) => setEInst(e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white font-mono"
                                placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                value={eMemberCode}
                                onChange={(e) => setEMemberCode(e.target.value)}
                              />
                            </div>

                            <FileUploader
                              label="সদস্যের ছবি আপলোড করুন বা সরাসরি লিঙ্ক দিন (ঐচ্ছিক):"
                              value={ePhotoUrl}
                              onChange={(url) => setEPhotoUrl(url)}
                              placeholder="ছবির সরাসরি লিঙ্ক (URL) অথবা ফাইল"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                if (!eName || !eRole) return;
                                const updated = [...(db.settings.leadersExecutive || []), {
                                  name: eName,
                                  role: eRole,
                                  inst: eInst || null,
                                  memberCode: eMemberCode || null,
                                  photoUrl: ePhotoUrl || null
                                }];
                                handleSaveExecutive(updated);
                                setEName('');
                                setERole('কার্যকরী সদস্য');
                                setEInst('');
                                setEMemberCode('');
                                setEPhotoUrl('');
                              }}
                              disabled={isSavingLeaders || !eName || !eRole}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Units (Campuses / Schools) Section */}
                      {leadersSubTab === 'units' && (
                        <div className="space-y-4 font-sans">
                          {/* Unit lists */}
                          <div className="space-y-3 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded bg-white dark:bg-zinc-955">
                            {(db.settings.leadersUnits || []).map((unit: any, idx: number) => (
                              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded border border-zinc-150 dark:border-zinc-850 space-y-2">
                                <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                                  <span className="font-extrabold text-xs text-rose-700 dark:text-rose-455">{unit.unitName}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (db.settings.leadersUnits || []).filter((_: any, i: number) => i !== idx);
                                      handleSaveUnits(updated);
                                    }}
                                    disabled={isSavingLeaders}
                                    className="text-rose-650 hover:text-rose-850 p-1 cursor-pointer"
                                    title="শাখা সংসদ মুছুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {(unit.leaders || []).map((leader: any, lidx: number) => (
                                    <div key={lidx} className="flex items-center gap-2 bg-white dark:bg-zinc-950 p-1.5 rounded border border-zinc-100 dark:border-zinc-900">
                                      {leader.photoUrl && (
                                        <img src={leader.photoUrl} alt={leader.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-800 pointer-events-auto cursor-pointer" onClick={() => {
                                          if (leader.memberCode) {
                                            setPreviewMemberId(leader.memberCode);
                                          }
                                        }} referrerPolicy="no-referrer" />
                                      )}
                                      <div>
                                        <span className="font-bold cursor-pointer text-zinc-850 dark:text-zinc-200 hover:text-rose-600 hover:underline" onClick={() => {
                                          if (leader.memberCode) {
                                            setPreviewMemberId(leader.memberCode);
                                          }
                                        }}>{leader.name}</span>
                                        <span className="text-zinc-500 font-medium ml-1">({leader.role})</span>
                                        {leader.memberCode && (
                                          <span className="block text-[8px] text-zinc-400 font-mono font-bold leading-none mt-0.5">{leader.memberCode}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-955 space-y-3.5">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455 font-sans">নতুন ক্যাম্পাস/শিক্ষাঙ্গন সংসদ যুক্ত করুন</h5>
                            
                            <div className="space-y-1">
                              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold font-sans">শিক্ষা প্রতিষ্ঠান / স্কুল ফোরাম শাখার নাম</label>
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white w-full font-sans"
                                placeholder="যেমনঃ আনন্দ মোহন কলেজ সংসদ বা ময়মনসিংহ জিলা স্কুল ফোরাম"
                                value={uUnitName}
                                onChange={(e) => setUUnitName(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 font-sans">
                              {/* Leader 1 */}
                              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded text-xs space-y-2">
                                <h6 className="text-[10px] font-extrabold text-rose-750 dark:text-rose-400 uppercase tracking-wider">নেতৃত্ব ১:</h6>
                                
                                <div className="space-y-1">
                                  <label className="text-[10px] text-zinc-400 font-bold block">সদস্য তালিকায় খুঁজুন ও লিঙ্ক করুন</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="নাম বা আইডি..."
                                      className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 w-full bg-white dark:bg-zinc-950 text-zinc-850 dark:text-white"
                                      value={unitLead1SearchText}
                                      onChange={(e) => setUnitLead1SearchText(e.target.value)}
                                    />
                                    {unitLead1SearchText && (
                                      <div className="absolute z-20 top-full inset-x-0 mt-1 max-h-32 overflow-y-auto bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-[10px]">
                                        {db.memberships
                                          .filter(m => m.status === 'verified' && (
                                            m.name.toLowerCase().includes(unitLead1SearchText.toLowerCase()) || 
                                            m.id.toLowerCase().includes(unitLead1SearchText.toLowerCase())
                                          ))
                                          .map(m => {
                                            const cleanId = \`SSF-MYM-\${m.id.substring(m.id.length - 5).toUpperCase()}\`;
                                            return (
                                              <button
                                                type="button"
                                                key={m.id}
                                                onClick={() => {
                                                  setULeadName1(m.name);
                                                  setULead1MemberCode(cleanId);
                                                  setULead1PhotoUrl(m.photoUrl || '');
                                                  setUnitLead1SearchText('');
                                                }}
                                                className="w-full px-2 py-1 text-left hover:bg-rose-50 dark:hover:bg-rose-955/20 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 cursor-pointer block"
                                              >
                                                <span className="font-bold">{m.name}</span> • <span className="font-mono text-[9px]">{cleanId}</span>
                                              </button>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-950 text-zinc-955 dark:text-white"
                                  placeholder="নেতৃত্ব ১ এর নাম"
                                  value={uLeadName1}
                                  onChange={(e) => setULeadName1(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-955 dark:text-white"
                                  placeholder="পদবী (যেমনঃ সভাপতি, আহ্বায়ক)"
                                  value={uLeadRole1}
                                  onChange={(e) => setULeadRole1(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-950 text-zinc-955 dark:text-white font-mono"
                                  placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                  value={uLead1MemberCode}
                                  onChange={(e) => setULead1MemberCode(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-955 dark:text-white"
                                  placeholder="ছবি ইউআরএল (ঐচ্ছিক)"
                                  value={uLead1PhotoUrl}
                                  onChange={(e) => setULead1PhotoUrl(e.target.value)}
                                />
                              </div>

                              {/* Leader 2 */}
                              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded text-xs space-y-2">
                                <h6 className="text-[10px] font-extrabold text-rose-750 dark:text-rose-455 uppercase tracking-wider">নেতৃত্ব ২ (ঐচ্ছিক):</h6>
                                
                                <div className="space-y-1">
                                  <label className="text-[10px] text-zinc-400 font-bold block">সদস্য তালিকায় খুঁজুন ও লিঙ্ক করুন</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="নাম বা আইডি..."
                                      className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 w-full bg-white dark:bg-zinc-950 text-zinc-850 dark:text-white"
                                      value={unitLead2SearchText}
                                      onChange={(e) => setUnitLead2SearchText(e.target.value)}
                                    />
                                    {unitLead2SearchText && (
                                      <div className="absolute z-20 top-full inset-x-0 mt-1 max-h-32 overflow-y-auto bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-[10px]">
                                        {db.memberships
                                          .filter(m => m.status === 'verified' && (
                                            m.name.toLowerCase().includes(unitLead2SearchText.toLowerCase()) || 
                                            m.id.toLowerCase().includes(unitLead2SearchText.toLowerCase())
                                          ))
                                          .map(m => {
                                            const cleanId = \`SSF-MYM-\${m.id.substring(m.id.length - 5).toUpperCase()}\`;
                                            return (
                                              <button
                                                type="button"
                                                key={m.id}
                                                onClick={() => {
                                                  setULeadName2(m.name);
                                                  setULead2MemberCode(cleanId);
                                                  setULead2PhotoUrl(m.photoUrl || '');
                                                  setUnitLead2SearchText('');
                                                }}
                                                className="w-full px-2 py-1 text-left hover:bg-rose-50 dark:hover:bg-rose-955/20 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 cursor-pointer block"
                                              >
                                                <span className="font-bold">{m.name}</span> • <span className="font-mono text-[9px]">{cleanId}</span>
                                              </button>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-950 text-zinc-955 dark:text-white"
                                  placeholder="নেতৃত্ব ২ এর নাম"
                                  value={uLeadName2}
                                  onChange={(e) => setULeadName2(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-955 dark:text-white"
                                  placeholder="পদবী (যেমনঃ সাধারণ সম্পাদক)"
                                  value={uLeadRole2}
                                  onChange={(e) => setULeadRole2(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-950 text-zinc-955 dark:text-white font-mono"
                                  placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                  value={uLead2MemberCode}
                                  onChange={(e) => setULead2MemberCode(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-955 dark:text-white"
                                  placeholder="ছবি ইউআরএল (ঐচ্ছিক)"
                                  value={uLead2PhotoUrl}
                                  onChange={(e) => setULead2PhotoUrl(e.target.value)}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!uUnitName || !uLeadName1 || !uLeadRole1) return;
                                const committeeLeaders = [{
                                  name: uLeadName1,
                                  role: uLeadRole1,
                                  memberCode: uLead1MemberCode ? uLead1MemberCode.trim() : null,
                                  photoUrl: uLead1PhotoUrl ? uLead1PhotoUrl.trim() : null
                                }];
                                if (uLeadName2 && uLeadRole2) {
                                  committeeLeaders.push({
                                    name: uLeadName2,
                                    role: uLeadRole2,
                                    memberCode: uLead2MemberCode ? uLead2MemberCode.trim() : null,
                                    photoUrl: uLead2PhotoUrl ? uLead2PhotoUrl.trim() : null
                                  });
                                }
                                const updated = [...(db.settings.leadersUnits || []), { unitName: uUnitName, leaders: committeeLeaders }];
                                handleSaveUnits(updated);
                                setUUnitName('');
                                setULeadName1('');
                                setULeadRole1('');
                                setULead1MemberCode('');
                                setULead1PhotoUrl('');
                                setULeadName2('');
                                setULeadRole2('');
                                setULead2MemberCode('');
                                setULead2PhotoUrl('');
                              }}
                              disabled={isSavingLeaders || !uUnitName || !uLeadName1 || !uLeadRole1}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer font-sans"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Former Student Leaders Section */}
                      {leadersSubTab === 'former' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-805 p-2.5 rounded bg-white dark:bg-zinc-950">
                            {(db.settings.leadersFormer || []).map((former: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded border border-zinc-100 dark:border-zinc-850">
                                <div className="text-xs">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{former.name}</span>
                                  <span className="text-zinc-500 text-[10px] ml-2 block sm:inline font-mono">({former.duration})</span>
                                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1 italic leading-normal font-sans">অবদান ও পরিচয়ঃ {former.contribution}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (db.settings.leadersFormer || []).filter((_, i) => i !== idx);
                                    handleSaveFormer(updated);
                                  }}
                                  disabled={isSavingLeaders}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer shrink-0"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 space-y-3">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455">নতুন সাবেক নেতৃত্ব বিবরণী যুক্ত করুন</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="সাবেক নেতার নাম"
                                value={fName}
                                onChange={(e) => setFName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="নেতৃত্বের মেয়াদ (যেমনঃ ১৯৯৪ - ১৯৯৮)"
                                value={fDuration}
                                onChange={(e) => setFDuration(e.target.value)}
                              />
                            </div>
                            <textarea
                              className="text-xs border border-zinc-200 dark:border-zinc-850 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white w-full h-16 resize-none"
                              placeholder="সংक्षिप्त অবদান ও পরিচয়াবলী (যেমনঃ প্রাক্তন জেলা সভাপতি ও শ্রমিক আন্দোলনের বুদ্ধিজীবী)"
                              value={fContribution}
                              onChange={(e) => setFContribution(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!fName || !fDuration || !fContribution) return;
                                const updated = [...(db.settings.leadersFormer || []), { name: fName, duration: fDuration, contribution: fContribution }];
                                handleSaveFormer(updated);
                                setFName('');
                                setFDuration('');
                                setFContribution('');
                              }}
                              disabled={isSavingLeaders || !fName || !fDuration}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Membership approval subsystem */}
          {activeSubTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 font-sans">অনলাইন সদস্যভুক্তি ও সেল অনুমোদন</h3>
                    <p className="text-[11px] text-zinc-500 font-sans mt-1">
                      শ্রেণী ও সেশন ডিক্লেয়ারেশন অনুযায়ী আবেদনকারীদের অনুমোদন দিন এবং তাদের রোল ও ব্যাজ নির্ধারণ করুন।
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewMName('');
                      setNewMMobile('');
                      setNewMEmail('');
                      setNewMPassword('123456');
                      setNewMInst('');
                      setNewMDept('');
                      setNewMYear('');
                      setNewMAddress('');
                      setNewMDob('');
                      setNewMBloodGroup('');
                      setNewMPhotoUrl('');
                      setShowCreateMemberForm(!showCreateMemberForm);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-center font-sans tracking-wide"
                  >
                    <PlusCircle className="w-4 h-4" />
                    সরাসরি নতুন সদস্য যুক্ত করুন
                  </button>
                </div>
              </div>

              {/* Directly Create Member Form container */}
              {showCreateMemberForm && (
                <form onSubmit={handleCreateMemberSubmit} className="p-4 border border-emerald-250 dark:border-emerald-900/50 rounded bg-zinc-50 dark:bg-zinc-950 space-y-4">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest font-sans flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      মেম্বারশিপ সেল সংযুক্তি (নতুন ডাটা এন্ট্রি)
                    </h4>
                  </div>

                  {createMemberError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded text-xs">
                      {createMemberError}
                    </div>
                  )}

                  {createMemberSuccess && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-xs">
                      {createMemberSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">সদস্যের নাম</label>
                      <input
                        type="text"
                        placeholder="যেমন: মোঃ সাব্বির হাসান"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMName}
                        onChange={(e) => setNewMName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">মোবাইল নম্বর</label>
                      <input
                        type="text"
                        placeholder="যেমন: 017xxxxxxxx"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMMobile}
                        onChange={(e) => setNewMMobile(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">ইমেল ঠিকানা (ঐচ্ছিক)</label>
                      <input
                        type="email"
                        placeholder="যেমন: user@example.com"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMEmail}
                        onChange={(e) => setNewMEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">অস্থায়ী পাসওয়ার্ড</label>
                      <input
                        type="text"
                        placeholder="ডিফল্ট: 123456"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMPassword}
                        onChange={(e) => setNewMPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">ভর্তি শিক্ষাঙ্গন/প্রতিষ্ঠান</label>
                      <input
                        type="text"
                        placeholder="যেমন: আনন্দ মোহন কলেজ"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMInst}
                        onChange={(e) => setNewMInst(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-655 dark:text-zinc-355 uppercase mb-1">শ্রেণি বা বিভাগ</label>
                      <input
                        type="text"
                        placeholder="যেমন: বিএসসি (অনার্স)"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMDept}
                        onChange={(e) => setNewMDept(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">জন্ম তারিখ (DOB)</label>
                      <input
                        type="text"
                        placeholder="যেমন: ১৫ আগস্ট ১৯৯৯"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMDob}
                        onChange={(e) => setNewMDob(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">রক্তের গ্রুপ</label>
                      <select
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-sans text-zinc-900 dark:text-white"
                        value={newMBloodGroup}
                        onChange={(e) => setNewMBloodGroup(e.target.value)}
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">প্রোফাইল ছবি ইউআরএল</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMPhotoUrl}
                        onChange={(e) => setNewMPhotoUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      যুক্ত করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateMemberForm(false)}
                      className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                </form>
              )}
`;
const finalContent = beforePart + middlePart + afterPart;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("RECONSTRUCT SUCCESS!");
fs.unlinkSync(path.join(__dirname, 'repair.cjs')); // cleanup
