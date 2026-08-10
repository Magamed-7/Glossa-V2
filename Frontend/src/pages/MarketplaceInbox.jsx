import { useState, useEffect, useRef } from "react";
import Icon from "../components/ui/Icon.jsx";
import { useT, useI18n } from "../lib/i18n.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { api } from "../lib/api/client.js";

function localizedServiceTitle(proposal, lang) {
  return proposal?.[`service_title_${lang}`] || proposal?.service_title;
}

const STATUS_KEY = {
  pending: "proposalStatusPending",
  active: "proposalStatusActive",
  completed: "proposalStatusCompleted",
  declined: "proposalStatusDeclined",
};

export default function MarketplaceInbox() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("NEGOTIATIONS"); // NEGOTIATIONS or ANNOUNCEMENTS

  const chatEndRef = useRef(null);

  const fetchProposals = async () => {
    try {
      const res = await api.get("/lingo/proposals");
      setProposals(res || []);
    } catch (err) {
      console.error("Error loading proposals:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Fetch messages thread when selection changes
  useEffect(() => {
    if (!selectedProposal) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/lingo/proposals/${selectedProposal.id}/messages`);
        setMessages(res || []);
      } catch (err) {
        console.error("Error loading chat messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedProposal]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProposal) return;

    try {
      const res = await api.post(
        `/lingo/proposals/${selectedProposal.id}/messages`,
        { text: newMessage }
      );
      setMessages((prev) => [...prev, res]);
      setNewMessage("");
      fetchProposals(); // Refresh last message in list
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleProposalAction = async (action) => {
    if (!selectedProposal) return;
    try {
      const res = await api.post(
        `/lingo/proposals/${selectedProposal.id}/action`,
        { action }
      );
      setSelectedProposal(res);
      fetchProposals();
      window.dispatchEvent(new Event("balance_update"));
    } catch (err) {
      alert(err.message || "Action failed");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#3a3a3a] min-h-[600px] animate-fade-in">
      
      {/* Dialogue List Queue Sidebar (4 cols) */}
      <div className="lg:col-span-4 border-r-2 border-black dark:border-stone-800 pr-6 flex flex-col gap-6">
        
        {/* Hub Header & Tabs */}
        <div>
          <span className="text-[10px] tracking-widest font-black uppercase text-[#E32652] dark:text-[#f43f5e] font-label">
            {t("market.providerDashboard")}
          </span>
          <h2 className="font-serif text-3xl font-black text-black dark:text-white lowercase mt-1">
            {t("market.inbox")}
          </h2>

          {/* Negotiations vs Announcements Tabs Selector */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("NEGOTIATIONS")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all ${
                activeTab === "NEGOTIATIONS"
                  ? "bg-white dark:bg-stone-800 text-black dark:text-stone-100 shadow-[2px_2px_0px_#000]"
                  : "bg-gray-100 dark:bg-stone-950 text-gray-400 dark:text-stone-600 border-gray-300 dark:border-stone-800"
              }`}
            >
              {t("market.negotiations")}
            </button>
            <button
              onClick={() => setActiveTab("ANNOUNCEMENTS")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all ${
                activeTab === "ANNOUNCEMENTS"
                  ? "bg-white dark:bg-stone-800 text-black dark:text-stone-100 shadow-[2px_2px_0px_#000]"
                  : "bg-gray-100 dark:bg-stone-950 text-gray-400 dark:text-stone-600 border-gray-300 dark:border-stone-800"
              }`}
            >
              {t("market.announcements")}
            </button>
          </div>
        </div>

        {/* Dialogue List */}
        <div className="flex-1 overflow-y-auto space-y-4 max-h-[450px]">
          {loadingProposals ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-gray-100 dark:bg-stone-800 animate-pulse border border-black" />
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-300 dark:border-stone-700">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {t("market.noListings")}
              </span>
            </div>
          ) : (
            proposals.map((p) => {
              const isProvider = p.provider_id === user?.id;
              const contactName = isProvider ? p.client_name : p.provider_name;
              const isSelected = selectedProposal?.id === p.id;
              const isCompleted = p.status === "completed" || p.status === "declined";

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProposal(p)}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    isCompleted 
                      ? "border-dashed border-gray-400 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950/20 opacity-60" 
                      : "border-black bg-white dark:bg-stone-900 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a]"
                  } ${
                    isSelected ? "ring-2 ring-[#E32652] -translate-y-0.5" : "hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full border border-black bg-yellow-200 dark:bg-stone-800 flex items-center justify-center font-bold text-xs shrink-0 text-black dark:text-stone-300 uppercase">
                        {contactName ? contactName.substring(0, 2) : "LN"}
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-sm text-black dark:text-stone-100 truncate">
                          {contactName}
                        </h4>
                        <p className="text-[10px] text-[#E32652] dark:text-[#f43f5e] font-sans font-semibold truncate">
                          {localizedServiceTitle(p, lang)}
                        </p>
                      </div>
                    </div>

                    <span 
                      className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 border ${
                        p.status === "pending"
                          ? "bg-amber-100 text-amber-700 border-amber-400"
                          : p.status === "active"
                          ? "bg-blue-100 text-blue-700 border-blue-400"
                          : p.status === "completed"
                          ? "bg-gray-100 text-gray-600 border-gray-400"
                          : "bg-red-100 text-red-700 border-red-400"
                      }`}
                    >
                      {t(`market.${STATUS_KEY[p.status] || "proposalStatusPending"}`)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message History Chat Workspace (8 cols) */}
      <div className="lg:col-span-8 flex flex-col min-h-[500px]">
        {selectedProposal ? (
          <>
            <div className="border-b-2 border-black dark:border-stone-800 pb-4 mb-4 flex justify-between items-center gap-4">
              <div>
                <h3 className="font-serif text-lg font-black text-black dark:text-stone-100">
                  {selectedProposal.provider_id === user?.id
                    ? selectedProposal.client_name
                    : selectedProposal.provider_name}
                </h3>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-mono">
                  {t("market.reLabel")} {localizedServiceTitle(selectedProposal, lang)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black dark:text-stone-300 font-mono">
                  {t("market.price").toUpperCase()}: {selectedProposal.price} {selectedProposal.currency || "TJS"}
                </span>
              </div>
            </div>

            {/* Messages Thread viewport */}
            <div className="flex-1 overflow-y-auto space-y-8 p-4 bg-[#FDFBF7] dark:bg-stone-950/40 border border-black dark:border-stone-800 max-h-[300px] min-h-[250px]">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Icon name="sync" className="animate-spin text-gray-400" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;

                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div 
                        className={`relative max-w-sm px-5 py-4 border-2 border-black shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a] transition-all hover:scale-[1.01] ${
                          isMine 
                            ? "bg-[#FDE2B6] dark:bg-stone-800 text-black dark:text-stone-100" 
                            : "bg-white dark:bg-stone-900 text-black dark:text-stone-100"
                        } before:absolute before:top-[-6px] before:left-[50%] before:-translate-x-1/2 before:w-10 before:h-3 before:bg-yellow-200/50 dark:before:bg-stone-700/40 before:border-x before:border-black/10 before:rotate-[-2deg]`}
                      >
                        <span className="text-[9px] text-gray-400 dark:text-stone-500 font-bold block mb-1">
                          {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <p className="text-xs font-sans font-medium whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Pending Negotiation terms review box */}
            {selectedProposal.status === "pending" && selectedProposal.client_id === user?.id && (
              <div className="mt-4 p-4 border-2 border-black bg-amber-50 dark:bg-stone-800 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a] flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <Icon name="info" className="text-amber-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-black uppercase text-amber-800 dark:text-amber-400">
                      {t("market.proposalPendingAcceptance")}
                    </h5>
                    <p className="text-[10px] text-amber-700 dark:text-stone-300 font-medium">
                      {t("market.acceptProposalHint", { price: selectedProposal.price })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => handleProposalAction("decline")}
                    className="flex-1 sm:flex-initial px-4 py-2 border-2 border-black bg-white hover:bg-stone-100 text-black font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000000]"
                  >
                    {t("market.cancel")}
                  </button>
                  <button
                    onClick={() => handleProposalAction("confirm")}
                    className="flex-1 sm:flex-initial px-4 py-2 border-2 border-black bg-[#E32652] hover:bg-[#c11c42] text-white font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1"
                  >
                    {t("market.confirmTermsAndPay")} <Icon name="arrow_forward" className="text-sm" />
                  </button>
                </div>
              </div>
            )}

            {/* Send Input Area form */}
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center border-2 border-black dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-black dark:text-stone-300 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a] shrink-0"
              >
                <Icon name="attach_file" />
              </button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("market.messagePlaceholder")}
                className="flex-1 px-4 py-2 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-700 text-black dark:text-stone-100 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#E32652]"
              />

              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 flex items-center justify-center border-2 border-black dark:border-stone-700 bg-[#E32652] hover:bg-[#c11c42] text-white disabled:opacity-40 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a] shrink-0"
              >
                <Icon name="send" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-gray-300 dark:border-stone-700 p-8 text-center text-gray-400">
            <Icon name="chat" className="text-5xl mb-2" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-stone-300">
              {t("market.noConversationSelected")}
            </h4>
            <p className="text-xs text-gray-500 dark:text-stone-400 mt-1">
              {t("market.selectConversationHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
