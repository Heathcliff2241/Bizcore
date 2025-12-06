'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setStatus({
        type: 'error',
        message: 'Please fill in all fields',
      });
      return;
    }

    setStatus({ type: 'loading' });

    try {
      const response = await fetch('/api/landing-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus({
        type: 'success',
        message: 'Thank you! Your message has been sent. We\'ll be in touch soon.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus({ type: 'idle' });
      }, 5000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          disabled={status.type === 'loading'}
          className="w-full p-3 rounded-lg border border-blue-700/30 bg-slate-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          disabled={status.type === 'loading'}
          className="w-full p-3 rounded-lg border border-blue-700/30 bg-slate-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
      </div>
      <input
        type="text"
        name="subject"
        placeholder="Subject"
        value={formData.subject}
        onChange={handleChange}
        disabled={status.type === 'loading'}
        className="w-full p-3 rounded-lg border border-blue-700/30 bg-slate-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
      />
      <textarea
        name="message"
        placeholder="Your Message"
        rows={5}
        value={formData.message}
        onChange={handleChange}
        disabled={status.type === 'loading'}
        className="w-full p-3 rounded-lg border border-blue-700/30 bg-slate-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition"
      />

      {/* Status Messages */}
      {status.type === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-900/30 border border-green-600/50 rounded-lg flex items-center gap-3"
        >
          <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300">{status.message}</p>
        </motion.div>
      )}

      {status.type === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/30 border border-red-600/50 rounded-lg flex items-center gap-3"
        >
          <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300">{status.message}</p>
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={status.type === 'loading'}
        whileHover={{ scale: status.type === 'loading' ? 1 : 1.02 }}
        whileTap={{ scale: status.type === 'loading' ? 1 : 0.98 }}
        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-400 transition shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status.type === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Sending...
          </span>
        ) : (
          'Send Message'
        )}
      </motion.button>
    </form>
  );
}
