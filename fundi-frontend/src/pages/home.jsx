import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckIcon,
  MessageIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  ToolIcon,
  UserIcon,
} from "../components/Icons";
import BrandLogo from "../components/BrandLogo";
import StarRating from "../components/StarRating";

const showcaseSlides = [
  {
    eyebrow: "Smart geolocation",
    title: "See the right fundis first, based on real distance.",
    text: "Choose your apartment, building, estate or current location. FundiLink stores accurate coordinates and brings the nearest available professionals to the top.",
    accent: "from-emerald-500 to-teal-700",
    tag: "2.4 km away",
    icon: SearchIcon,
  },
  {
    eyebrow: "Clear pricing",
    title: "Set a budget or agree on the final price together.",
    text: "Post a fixed budget or mark it negotiable. Once you select a fundi, confirm the agreed price on the job before payment.",
    accent: "from-blue-500 to-indigo-700",
    tag: "KES 3,500 agreed",
    icon: CheckIcon,
  },
  {
    eyebrow: "M-PESA ready",
    title: "Pay from the job when the work is complete.",
    text: "The fundi marks the work finished, the client receives a payment prompt, and FundiLink records the result against the job.",
    accent: "from-green-500 to-emerald-800",
    tag: "Prompt sent",
    icon: ShieldIcon,
  },
  {
    eyebrow: "Real reputation",
    title: "Tap the stars and leave a review that builds trust.",
    text: "Completed work becomes part of the fundi portfolio. Interactive ratings and written reviews help the next client choose confidently.",
    accent: "from-amber-400 to-orange-600",
    tag: "5.0 Excellent",
    icon: StarIcon,
  },
];

const Home = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(!!localStorage.getItem("token"));
      setRole(localStorage.getItem("role"));
    };

    syncAuth();
    window.addEventListener("authChanged", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("authChanged", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % showcaseSlides.length),
      4500
    );
    return () => window.clearInterval(interval);
  }, []);

  const dashboardLink =
    role === "client"
      ? "/client-dashboard"
      : role === "fundi"
        ? "/fundi-dashboard"
        : "/admin-dashboard";
  const slide = showcaseSlides[activeSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7faf7] text-gray-950">
      <section className="relative isolate overflow-hidden bg-[#071b12] text-white">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-green-500/20 blur-3xl" />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-4 py-2 text-sm font-semibold text-green-100">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Verified skills. Nearby. Ready to work.
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-tight md:text-7xl">
              Good work should be{" "}
              <span className="bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent">
                easier to find.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
              Find a verified fundi near you, agree on the job, pay through
              M-PESA and share a real review — all in one clear workflow.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to={loggedIn ? dashboardLink : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 font-bold text-gray-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400"
              >
                <UserIcon className="h-5 w-5" />
                {loggedIn ? "Open Dashboard" : "Find a Fundi"}
              </Link>
              {!loggedIn && (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <ToolIcon className="h-5 w-5" />
                  Join as a Fundi
                </Link>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-gray-300">
              {["Location-aware results", "Verified profiles", "M-PESA workflow"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-400/20 text-green-300">
                      ✓
                    </span>
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="hero-float rounded-[2rem] border border-white/10 bg-white p-5 text-gray-950 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <BrandLogo className="h-12 w-12" />
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                  Job active
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-950 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-green-300">
                      Nearest verified match
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">James · Plumber</h2>
                  </div>
                  <span className="rounded-lg bg-white/10 px-3 py-2 text-sm">
                    1.8 km
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StarRating value={5} readOnly size="sm" />
                  <span className="text-sm text-gray-300">47 completed jobs</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-xs font-bold uppercase text-green-700">Price</p>
                  <p className="mt-1 text-xl font-black">KES 3,500</p>
                  <p className="text-xs text-gray-500">Agreed by both sides</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase text-amber-700">Payment</p>
                  <p className="mt-1 text-xl font-black">M-PESA</p>
                  <p className="text-xs text-gray-500">Pay after completion</p>
                </div>
              </div>
            </div>

            <div className="hero-float-delayed absolute -bottom-7 -left-8 hidden rounded-2xl border border-white/10 bg-green-500 px-5 py-4 text-gray-950 shadow-xl sm:block">
              <p className="text-xs font-bold uppercase">Live location</p>
              <p className="font-black">Sorted nearest first</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-200 px-6 py-7 md:grid-cols-4">
          {[
            ["Nearby first", "Distance-aware matching"],
            ["One job chat", "Everything stays together"],
            ["Clear prices", "Fixed or negotiable"],
            ["Real reviews", "Only after completed work"],
          ].map(([title, text]) => (
            <div key={title} className="px-4 py-3 text-center">
              <p className="font-black text-gray-950">{title}</p>
              <p className="mt-1 text-xs text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
              What’s new in FundiLink
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              A better journey from search to finished work.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              Explore the features that make local hiring feel more reliable.
              The showcase moves automatically, or you can choose a feature.
            </p>
            <div className="mt-7 flex gap-2">
              {showcaseSlides.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show ${item.eyebrow}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide
                      ? "w-10 bg-green-600"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            key={activeSlide}
            className="showcase-enter overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl"
          >
            <div className={`bg-gradient-to-br ${slide.accent} p-7 text-white md:p-10`}>
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <SlideIcon className="h-7 w-7" />
                </span>
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
                  {slide.tag}
                </span>
              </div>
              <p className="mt-12 text-sm font-black uppercase tracking-[0.18em] text-white/75">
                {slide.eyebrow}
              </p>
              <h3 className="mt-3 max-w-2xl text-3xl font-black leading-tight md:text-4xl">
                {slide.title}
              </h3>
            </div>
            <div className="p-7 md:p-9">
              <p className="text-lg leading-relaxed text-gray-600">{slide.text}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eaf5ee] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
              One accountable process
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Know what happens at every step.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {[
              ["01", "Share the job", "Describe the work, location and budget."],
              ["02", "Choose nearby", "Compare verified fundis ordered by distance."],
              ["03", "Agree clearly", "Chat and save the final agreed price."],
              ["04", "Pay on completion", "Receive an M-PESA prompt after the work is done."],
              ["05", "Rate the work", "Tap the stars and leave a useful review."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="group rounded-2xl border border-green-900/10 bg-white p-6 transition hover:-translate-y-2 hover:shadow-xl"
              >
                <span className="text-sm font-black text-green-700">{number}</span>
                <h3 className="mt-8 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div className="rounded-[2rem] bg-gray-950 p-8 text-white md:p-12">
          <MessageIcon className="h-10 w-10 text-green-400" />
          <blockquote className="mt-8 text-2xl font-bold leading-relaxed md:text-3xl">
            “The best marketplace is not just a list of names. It helps both
            sides agree, finish, pay and build a reputation.”
          </blockquote>
          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">
            The FundiLink promise
          </p>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
            Built for Kenya’s everyday work
          </p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">
            More opportunity for fundis. Less uncertainty for clients.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Verified identity", ShieldIcon],
              ["Professional portfolio", ToolIcon],
              ["Job-specific messages", MessageIcon],
              ["Interactive star reviews", StarIcon],
            ].map(([label, Icon]) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-green-600 px-6 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-black">Ready to get work moving?</h2>
            <p className="mt-2 text-green-50">
              Create your profile and start with a location you can actually find.
            </p>
          </div>
          <Link
            to={loggedIn ? dashboardLink : "/signup"}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-black text-green-800 shadow-lg transition hover:-translate-y-0.5"
          >
            <CheckIcon className="h-5 w-5" />
            {loggedIn ? "Open Dashboard" : "Create Account"}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
