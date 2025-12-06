'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { StorefrontContext } from './types';

type ContactFormProps = {
  heading?: string;
  subheading?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  accentColor?: string;
  padding?: number;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
  size?: { width: number; height: number };
};

export function ContactForm({
  heading = 'Get In Touch',
  subheading = 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
  backgroundColor = '#ffffff',
  textColor = '#000000',
  buttonColor = '#10b981',
  accentColor = '#3b82f6',
  padding = 60,
  storefront,
  fullWidth = true,
}: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: storefront?.subdomain,
          name,
          email,
          subject,
          message,
        }),
      });
      if (!res.ok) {
        setStatus('error');
      } else {
        setStatus('sent');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section
      className="w-full overflow-hidden"
      style={{
        backgroundColor,
        padding: `${padding}px`,
      }}
    >
      <motion.div
        className={`${fullWidth ? 'w-full' : 'max-w-2xl mx-auto'}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Header */}
        {heading && (
          <motion.h2
            className="text-4xl font-bold mb-4 text-center"
            style={{ color: textColor }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            {heading}
          </motion.h2>
        )}

        {subheading && (
          <motion.p
            className="text-lg text-center mb-12 opacity-80"
            style={{ color: textColor }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            {subheading}
          </motion.p>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          {/* Name and Email Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: textColor }}
              >
                Your Name
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none transition-all"
                style={{
                  borderColor: accentColor,
                  color: textColor,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: textColor }}
              >
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none transition-all"
                style={{
                  borderColor: accentColor,
                  color: textColor,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
            </motion.div>
          </div>

          {/* Subject */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: textColor }}
            >
              Subject
            </label>
            <input
              required
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we assist you?"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none transition-all"
              style={{
                borderColor: accentColor,
                color: textColor,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
          >
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: textColor }}
            >
              Message
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more about your inquiry..."
              rows={6}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none transition-all resize-none"
              style={{
                borderColor: accentColor,
                color: textColor,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          </motion.div>

          {/* Submit Button and Status */}
          <motion.div
            className="flex items-center gap-4 pt-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            viewport={{ once: true }}
          >
            <motion.button
              type="submit"
              disabled={status === 'sending'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: buttonColor }}
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </motion.button>

            {status === 'sent' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-600 font-medium"
              >
                <span className="text-xl">✓</span>
                <span>Message sent!</span>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-red-600 font-medium"
              >
                <span className="text-xl">✕</span>
                <span>Failed to send. Try again.</span>
              </motion.div>
            )}
          </motion.div>
        </motion.form>
      </motion.div>
    </section>
  );
}
