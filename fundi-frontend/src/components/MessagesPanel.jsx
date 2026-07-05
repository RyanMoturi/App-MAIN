import React, { useEffect, useState, useRef, useCallback } from 'react';

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
    <div className="grid md:grid-cols-3 gap-4 min-h-[400px]">
      <div className="md:col-span-1 bg-white rounded shadow">
        <div className="p-3 border-b font-semibold">Conversations</div>
        {loading ? (
          <div className="p-4 text-gray-500 text-sm">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm">No conversations yet. Message a fundi from Find Fundis.</div>
        ) : (
          <ul className="divide-y max-h-96 overflow-y-auto">
            {conversations.map((conv) => (
              <li key={`${conv.job_id}-${conv.other_user_role}-${conv.other_user_id}`}>
                <button
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-3 hover:bg-gray-50 ${
                    activeChat &&
                    !activeChat.isNew &&
                    String(activeChat.job_id) === String(conv.job_id) &&
                    String(activeChat.other_user_id) === String(conv.other_user_id)
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <div className="font-medium text-sm">{conv.other_user_name}</div>
                  <div className="text-xs text-gray-500">{conv.job_title}</div>
                  <div className="text-xs text-gray-600 truncate mt-1">{conv.last_message}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="md:col-span-2 bg-white rounded shadow flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
            Select a conversation or message a fundi to get started.
          </div>
        ) : (
          <>
            <div className="p-3 border-b">
              <div className="font-semibold">{activeChat.other_user_name}</div>
              <div className="text-sm text-gray-500">
                {activeChat.isNew && userRole === 'client' && clientJobs.length > 0 ? (
                  <select
                    value={selectedJobId}
                    onChange={(e) => handleJobSelect(e.target.value)}
                    className="mt-1 border rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select job...</option>
                    {clientJobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                ) : (
                  <>Regarding: {activeChat.job_title}</>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-80 space-y-3">
              {messages.map((msg) => {
                const isMine = String(msg.sender_id) === String(userId) && msg.sender_role === userRole;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                        isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPanel;
