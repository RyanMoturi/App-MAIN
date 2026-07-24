import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckIcon,
  MessageIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  ToolIcon,
  UserIcon,
} from '../components/Icons';

const Home = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(!!localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };

    syncAuth();
    window.addEventListener('authChanged', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('authChanged', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const dashboardLink =
    role === 'client'
      ? '/client-dashboard'
      : role === 'fundi'
        ? '/fundi-dashboard'
        : '/admin-dashboard';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gray-900" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200">
              <ShieldIcon className="h-4 w-4" />
              Verified local skills, safer hiring
            </div>

            <h1 className="max-w-3xl text-5xl font-extrabold leading-tight md:text-6xl">
              Find a trusted fundi without chasing referrals all day.
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-gray-300">
              Fundi-Link connects clients with skilled plumbers, electricians,
              carpenters, cleaners, painters, and other local professionals.
              Post a job, compare verified fundis, message them, and review the
              work after completion.
            </p>

            {!loggedIn ? (
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 font-semibold text-gray-950 hover:bg-gray-200 transition"
                >
                  <UserIcon className="h-5 w-5" />
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                >
                  <CheckIcon className="h-5 w-5" />
                  Login
                </Link>
              </div>
            ) : (
              <Link
                to={dashboardLink}
                className="mt-8 inline-flex items-center gap-2 rounded bg-white px-6 py-3 font-semibold text-gray-950 hover:bg-gray-200 transition"
              >
                <ToolIcon className="h-5 w-5" />
                Go to Dashboard
              </Link>
            )}
          </div>

          <div className="relative">
            <div className="rounded-lg border border-white/10 bg-white p-6 text-gray-900 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Job request</p>
                  <h2 className="text-2xl font-bold">Bathroom repair</h2>
                </div>
                <span className="rounded bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  Open
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  ['Verified plumber', '4.8 rating', ShieldIcon],
                  ['Direct message', 'Job-specific chat', MessageIcon],
                  ['Client review', 'Saved to portfolio', StarIcon],
                ].map(([title, detail, Icon]) => (
                  <div key={title} className="flex items-center gap-4 rounded bg-gray-100 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded bg-black text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-gray-600">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Why it matters
          </p>
          <h2 className="mt-2 text-4xl font-bold">
            Fundi-Link makes informal hiring feel organized and accountable.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Many clients rely on word of mouth, and many fundis struggle to show
            their work history. Fundi-Link gives both sides one place to find
            work, prove trust, communicate, and build reputation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['For clients', 'Post jobs, find skilled fundis by category or location, contact them, and rate completed work.', SearchIcon],
            ['For fundis', 'Apply for jobs, keep a complete profile, upload verification documents, and build a portfolio.', ToolIcon],
            ['For admins', 'Verify fundi details, review reports, and ban accounts when safety or trust is broken.', ShieldIcon],
          ].map(([title, text, Icon]) => (
            <div key={title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Icon className="h-8 w-8 text-blue-700" />
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-100 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {[
              ['1', 'Post a job', 'A client describes the work, skill needed, and location.'],
              ['2', 'Fundis apply', 'Verified fundis can apply and explain why they fit the job.'],
              ['3', 'Accept and chat', 'The client accepts one fundi and a job conversation opens.'],
              ['4', 'Complete and review', 'The completed job appears in the fundi portfolio with rating and review.'],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-lg bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded bg-black font-bold text-white">
                  {number}
                </span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Trust features
          </p>
          <h2 className="mt-2 text-4xl font-bold">
            Built for real jobs, real people, and real accountability.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Fundis can upload identification, profile photos, good conduct
            certificates, and professional certificates. Clients can report bad
            conduct, and admins can review the case before deciding what happens
            next.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Verified accounts', ShieldIcon],
            ['Job-specific messages', MessageIcon],
            ['Portfolio reviews', StarIcon],
            ['Admin reports', CheckIcon],
          ].map(([label, Icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-gray-200 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black px-6 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Ready to get work moving?</h2>
            <p className="mt-2 text-gray-300">
              Join as a client to post a job, or as a fundi to find paid work and build your reputation.
            </p>
          </div>
          <Link
            to={loggedIn ? dashboardLink : '/signup'}
            className="inline-flex items-center justify-center gap-2 rounded bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200 transition"
          >
            <ToolIcon className="h-5 w-5" />
            {loggedIn ? 'Open Dashboard' : 'Create Account'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
