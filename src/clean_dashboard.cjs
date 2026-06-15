const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "              {/* Directly Create Member Form container */}\n              {showCreateMemberForm && (";
const endMarker = "              <div className=\"flex flex-col sm:flex-row sm:items-center justify-between gap-4\">\n                <div></div>\n                \n                {/* Status selector pills */}\n                <div className=\"flex flex-wrap items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded border border-zinc-200 dark:border-zinc-800\">";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found", { startIndex, endIndex });
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const replacement = `              {/* Directly Create Member Form container */}
              {showCreateMemberForm && (
                <form onSubmit={handleCreateMemberSubmit} className="p-4 border border-emerald-250 dark:border-emerald-900/50 rounded bg-zinc-50 dark:bg-zinc-955 space-y-4 font-sans">
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
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">শিক্ষাবর্ষ বা সেশন</label>
                      <input
                        type="text"
                        placeholder="যেমন: ২০২০-২১"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMYear}
                        onChange={(e) => setNewMYear(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-655 dark:text-zinc-355 uppercase mb-1">বর্তমান ঠিকানা</label>
                      <input
                        type="text"
                        placeholder="যেমন: ময়মনসিংহ সদর"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMAddress}
                        onChange={(e) => setNewMAddress(e.target.value)}
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
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">সদস্যের ক্যাটাগরি</label>
                      <select
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-sans text-zinc-900 dark:text-white"
                        value={newMType}
                        onChange={(e) => setNewMType(e.target.value as any)}
                      >
                        <option value="member">সদস্য (Member)</option>
                        <option value="volunteer">স্বেচ্ছাসেবক / শুভাকাঙ্ক্ষী (Volunteer)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">অর্গানাইজেশনাল রোল</label>
                      <select
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-sans text-zinc-900 dark:text-white"
                        value={newMRoleTag}
                        onChange={(e) => setNewMRoleTag(e.target.value as any)}
                      >
                        <option value="member">কর্মী বা সাধারণ মেম্বার</option>
                        <option value="coordinator_admin">সহকারী এডমিন (সমন্বয়ক)</option>
                        <option value="super_admin">সুপার এডমিন</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-350 uppercase mb-1">ব্যাজ টাইটেল (যেমন: সাধারণ সদস্য)</label>
                      <input
                        type="text"
                        placeholder="যেমন: কর্মী সদস্য"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white"
                        value={newMBadgeText}
                        onChange={(e) => setNewMBadgeText(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
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
                      type="button"
                      onClick={() => setShowCreateMemberForm(false)}
                      className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-805 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded transition cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      যুক্ত করুন
                    </button>
                  </div>
                </form>
              )}

`;

fs.writeFileSync(filePath, before + replacement + after, 'utf8');
console.log("CLEAN MEMBER FORMS SUCCESS!");
fs.unlinkSync(__filename); // self cleanup
