import React, { useEffect, useState, useRef, useCallback } from 'react';

const Initials = ({ name = 'FundiLink' }) => (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-sm font-black text-white shadow-sm">
    {name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
  </span>
);

const displayTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessagesPanel = ({ pendingChat, clientJobs = [], onChatStarted }) => {
  const userRole = localStorage.getItem('role');
  const userId =
    localStorage.getItem('userId') ||
    (userRole === 'client'
      ? localStorage.getItem('clientId')
      : localStorage.getItem('fundiId'));
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const messagesEndRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?userId=${userId}&userRole=${userRole}`);
      if (res.ok) setConversations(await res.json());
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  const fetchMessages = useCallback(async (chat) => {
    if (!chat) return;
    const params = new URLSearchParams({
      jobId: chat.job_id,
      userId,
      userRole,
      otherUserId: chat.other_user_id,
      otherUserRole: chat.other_user_role,
    });
    const res = await fetch(`/api/messages?${params}`);
    if (res.ok) setMessages(await res.json());
  }, [userId, userRole]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (pendingChat && clientJobs.length > 0) {
      setSelectedJobId(String(clientJobs[0].id));
      setActiveChat({
        job_id: clientJobs[0].id,
        job_title: clientJobs[0].title,
        other_user_id: pendingChat.otherUserId,
        other_user_role: pendingChat.otherUserRole || 'fundi',
        other_user_name: pendingChat.otherUserName,
        isNew: true,
      });
    } else if (pendingChat) {
      setActiveChat({
        job_id: pendingChat.jobId,
        job_title: pendingChat.jobTitle || 'Select a job',
        other_user_id: pendingChat.otherUserId,
        other_user_role: pendingChat.otherUserRole || 'fundi',
        other_user_name: pendingChat.otherUserName,
        isNew: true,
      });
      if (pendingChat.jobId) setSelectedJobId(String(pendingChat.jobId));
    }
  }, [pendingChat, clientJobs]);

  useEffect(() => {
    if (activeChat && !activeChat.isNew) {
      fetchMessages(activeChat);
    }
  }, [activeChat, fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeChat && !activeChat.isNew) {
        fetchMessages(activeChat);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChat, fetchConversations, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conv) => {
    setActiveChat({ ...conv, isNew: false });
    onChatStarted?.();
  };

  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    const job = clientJobs.find((j) => String(j.id) === String(jobId));
    if (job && activeChat) {
      setActiveChat((prev) => ({
        ...prev,
        job_id: job.id,
        job_title: job.title,
        isNew: true,
      }));
      setMessages([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const jobId = activeChat.isNew ? selectedJobId : activeChat.job_id;
    if (!jobId) {
      alert('Please select a job to message about.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: Number(jobId),
          sender_id: Number(userId),
          receiver_id: Number(activeChat.other_user_id),
          sender_role: userRole,
          receiver_role: activeChat.other_user_role,
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error('Send failed');
      const { data } = await res.json();
      setMessages((prev) => [...prev, data]);
      setNewMessage('');

      if (activeChat.isNew) {
        const job = clientJobs.find((j) => String(j.id) === String(jobId));
        setActiveChat({
          job_id: Number(jobId),
          job_title: job?.title || activeChat.job_title,
          other_user_id: activeChat.other_user_id,
          other_user_role: activeChat.other_user_role,
          other_user_name: activeChat.other_user_name,
          isNew: false,
        });
        onChatStarted?.();
      }

      fetchConversations();
    } catch {
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="surface-card grid min-h-[620px] overflow-hidden lg:grid-cols-[340px_1fr]">
      <aside className="border-b border-gray-200 bg-stone-50/80 lg:border-b-0 lg:border-r">
        <div className="border-b border-gray-200 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Inbox</p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-950">Conversations</h3>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
              {conversations.length}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="m-5 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">💬</div>
            <p className="mt-4 font-bold text-gray-900">No conversations yet</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {userRole === 'client' ? 'Open Find Fundis and start a conversation.' : 'Messages from clients will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="max-h-[520px] space-y-1 overflow-y-auto p-3">
            {conversations.map((conv) => (
              <li key={`${conv.job_id}-${conv.other_user_role}-${conv.other_user_id}`}>
                <button
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full rounded-2xl p-3 text-left transition hover:bg-white hover:shadow-sm ${
                    activeChat &&
                    !activeChat.isNew &&
                    String(activeChat.job_id) === String(conv.job_id) &&
                    String(activeChat.other_user_id) === String(conv.other_user_id)
                      ? 'bg-white shadow-sm ring-1 ring-green-200'
                      : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <Initials name={conv.other_user_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black text-gray-950">{conv.other_user_name}</span>
                        <span className="text-[10px] font-medium text-gray-400">{displayTime(conv.last_message_at)}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-green-700">{conv.job_title}</div>
                      <div className="mt-1 truncate text-xs text-gray-500">{conv.last_message}</div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex min-w-0 flex-col bg-white">
        {!activeChat ? (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gray-950 text-3xl text-white shadow-xl">✦</div>
            <h3 className="mt-6 text-2xl font-black text-gray-950">Your work conversations</h3>
            <p className="mt-2 max-w-sm leading-7 text-gray-500">
              Select a conversation to discuss the job, confirm details and keep everything in one place.
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
              <Initials name={activeChat.other_user_name} />
              <div className="min-w-0">
                <div className="truncate font-black text-gray-950">{activeChat.other_user_name}</div>
                <div className="text-sm text-gray-500">
                {activeChat.isNew && userRole === 'client' && clientJobs.length > 0 ? (
                  <select
                    value={selectedJobId}
                    onChange={(e) => handleJobSelect(e.target.value)}
                    className="mt-1 rounded-lg border border-gray-300 bg-white py-1.5 pl-3 text-sm font-semibold"
                  >
                    <option value="">Select job...</option>
                    {clientJobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                ) : (
                  <span>Regarding <strong className="font-bold text-green-700">{activeChat.job_title}</strong></span>
                )}
                </div>
              </div>
              <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800 sm:flex">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Job chat
              </span>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.05),transparent_36%)] p-5 sm:p-7">
              {messages.length === 0 && (
                <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm leading-6 text-gray-500 shadow-sm">
                  This is the beginning of your conversation. Share the job details and agree on the next step.
                </div>
              )}
              {messages.map((msg) => {
                const isMine = String(msg.sender_id) === String(userId) && msg.sender_role === userRole;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[70%] ${
                        isMine
                          ? 'rounded-br-md bg-gray-950 text-white'
                          : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`mt-1 text-[10px] ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                        {displayTime(msg.sent_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-stone-50 p-2 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-100">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-0"
                />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                  className="flex h-11 items-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                  <span className="hidden sm:inline">{sending ? 'Sending' : 'Send'}</span>
                  <span aria-hidden="true">➤</span>
              </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default MessagesPanel;
