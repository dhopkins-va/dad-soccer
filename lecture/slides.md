---
theme: default
title: "Claude as the Next Excel"
info: |
  ## Build your first real app today
  Custom software for an audience of one
  
  By Dale Hopkins
author: Dale Hopkins
drawings:
  persist: false
transition: slide-left
mdc: true
highlighter: shiki
lineNumbers: false
hideInToc: true
css: unocss
---

# In-class signups

<div class="grid grid-cols-3 gap-6 mt-8">
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
    <div class="flex items-center gap-3 mb-4">
      <img src="/google-cloud.svg" class="w-10 h-10 invert" />
      <span class="text-xl font-bold text-green-500">Google Cloud</span>
    </div>
    <ul class="text-left text-sm space-y-2 list-disc pl-4 text-slate-300">
      <li>Free account</li>
      <li>OAuth consent screen</li>
      <li>Testing mode</li>
      <li>Client ID</li>
    </ul>
  </div>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
    <div class="flex items-center gap-3 mb-4">
      <img src="/supabase.svg" class="w-10 h-10 invert" />
      <span class="text-xl font-bold text-green-500">Supabase</span>
    </div>
    <ul class="text-left text-sm space-y-2 list-disc pl-4 text-slate-300">
      <li>Free account</li>
      <li>One project per student</li>
      <li>Google auth provider</li>
      <li>Row Level Security</li>
    </ul>
  </div>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
    <div class="flex items-center gap-3 mb-4">
      <img src="/github.svg" class="w-10 h-10 invert" />
      <span class="text-xl font-bold text-green-500">GitHub</span>
    </div>
    <ul class="text-left text-sm space-y-2 list-disc pl-4 text-slate-300">
      <li>Free account</li>
      <li>Student account</li>
    </ul>
  </div>
</div>

<p class="mt-8 text-slate-400 text-sm">
  <strong>Claude Code:</strong> assumed already installed
</p>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">1 / 12</div>

<!--
Welcome everyone! Before we dive in, please make sure you have accounts set up for these three services.
Google Cloud is for OAuth - we'll create a consent screen and get a client ID.
Supabase will handle our authentication and database.
GitHub for version control and deployment.
-->

---
layout: center
class: text-center
---

# Claude as the Next Excel

<h2 class="text-white! font-normal">Build your first <span class="text-green-500">real app</span> today</h2>

<p class="text-slate-400 mt-8">Custom software for an audience of one</p>

<p class="text-slate-500 mt-12 text-sm">Dale Hopkins</p>

<p class="text-slate-600 text-xs mt-6">Today's tools: the standard, but not the only, options</p>

<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">2 / 12</div>

<!--
The title says it all - Claude can help you build real applications as easily as you might create a spreadsheet.
The key insight: we're building for an audience of one - yourself, or a very small group with specific needs.
-->

---
layout: center
class: text-center
---

<div class="flex items-center justify-center gap-12">
  <div class="text-9xl font-bold text-green-500 leading-none">1</div>
  <div class="text-left">
    <p class="text-2xl text-slate-400 m-0">user</p>
  </div>
</div>

# Audience of one

<p class="text-slate-400">Apps that would never be built commercially</p>

<div class="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md mx-auto mt-8 text-left">
  <p class="text-green-500 font-bold m-0 mb-2">Example: rec soccer</p>
  <p class="text-slate-400 text-sm m-0">A father coaching under-10 rec soccer, optimizing fair play time</p>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">3 / 12</div>

<!--
This is the magic of audience-of-one apps.
Commercial software needs thousands of users to be viable.
But YOU only need one user - yourself.
My example: I coach my kid's soccer team and wanted to make sure every kid gets fair play time.
No company would build that, but Claude helped me build it in a weekend.
-->

---

# Why SSO first

<p class="text-slate-400">Start with the attacks it stops</p>

<div class="grid grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
  <div class="text-left space-y-6">
    <div>
      <h4 class="text-green-500 m-0 mb-1">Credential stuffing</h4>
      <p class="text-slate-400 text-sm m-0">No app password to reuse or leak</p>
    </div>
    <div>
      <h4 class="text-green-500 m-0 mb-1">Phishing</h4>
      <p class="text-slate-400 text-sm m-0">Credentials only go to Google's sign-in page</p>
    </div>
    <div>
      <h4 class="text-green-500 m-0 mb-1">Session hijacking</h4>
      <p class="text-slate-400 text-sm m-0">Short-lived tokens, not a static key</p>
    </div>
  </div>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center flex flex-col justify-center">
    <h3 class="text-green-500 text-2xl m-0">Protection first,</h3>
    <h3 class="text-green-500 text-2xl m-0">OAuth flow second</h3>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">4 / 12</div>

<!--
Why do we start with SSO? Because security should come FIRST, not be bolted on later.
Google handles all the hard security stuff - credential stuffing, phishing, token management.
You get enterprise-grade auth for free.
-->

---

# Google sign-in via Supabase

<div class="grid grid-cols-3 gap-6 mt-12">
  <div class="bg-green-500 text-slate-900 rounded-xl p-6 text-center">
    <div class="text-3xl font-bold">01.</div>
    <div class="font-semibold mt-2">Google Cloud</div>
    <div class="text-xs opacity-80 mt-1">OAuth consent screen and client ID</div>
  </div>
  <div class="bg-green-500 text-slate-900 rounded-xl p-6 text-center">
    <div class="text-3xl font-bold">02.</div>
    <div class="font-semibold mt-2">Supabase Auth</div>
    <div class="text-xs opacity-80 mt-1">Built-in Google provider; client secret stored in Supabase</div>
  </div>
  <div class="bg-green-500 text-slate-900 rounded-xl p-6 text-center">
    <div class="text-3xl font-bold">03.</div>
    <div class="font-semibold mt-2">GitHub Pages</div>
    <div class="text-xs opacity-80 mt-1">Hosts the front end, which never sees the secret</div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">5 / 12</div>

<!--
Here's the three-step flow:
1. Google Cloud gives us the OAuth consent screen and client ID
2. Supabase Auth's built-in Google provider handles sign-in; the client secret is stored securely in Supabase's auth settings
3. GitHub Pages hosts your front-end code, which never sees the secret
This is the secure pattern that keeps your app safe.
-->

---

# Keep secrets off the front end

<div class="grid grid-cols-3 gap-4 mt-8">
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
    <div class="text-2xl font-bold text-green-500">01</div>
    <div class="font-semibold mt-2">Users</div>
    <div class="text-slate-400 text-sm mt-1">Read and write data</div>
  </div>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
    <div class="text-2xl font-bold text-green-500">02</div>
    <div class="font-semibold mt-2">Owner</div>
    <div class="text-slate-400 text-sm mt-1">Alone spends the tokens</div>
  </div>
  <div class="bg-red-900 rounded-xl p-6 text-center">
    <div class="text-2xl font-bold text-red-300">03</div>
    <div class="font-semibold mt-2">Anti-pattern</div>
    <div class="text-red-300 text-sm mt-1">A static key in the front end</div>
  </div>
</div>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700 mt-6 text-center">
  <span class="text-green-500 font-semibold">Anon key:</span> public, fine in the client app
  <span class="mx-4 text-slate-500">|</span>
  <span class="text-red-400 font-semibold">Service role key:</span> never in the client
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">6 / 12</div>

<!--
This is the cardinal rule: secrets stay server-side.
The anon key is DESIGNED to be public - it's in your JavaScript, and that's fine.
The service role key has full database access - it NEVER goes in client code.
If you see the service role key in your frontend JS, stop and fix it immediately.
-->

---

# From spreadsheet to app

<div class="grid grid-cols-2 gap-8 max-w-3xl mx-auto mt-16">
  <div class="bg-green-500 text-slate-900 rounded-xl p-8 text-center">
    <div class="text-4xl font-bold">01.</div>
    <div class="font-bold text-xl mt-4">Sheet first</div>
    <div class="text-sm mt-2">Start from the spreadsheet</div>
  </div>
  <div class="bg-green-500 text-slate-900 rounded-xl p-8 text-center">
    <div class="text-4xl font-bold">02.</div>
    <div class="font-bold text-xl mt-4">Then a secure app</div>
    <div class="text-sm mt-2">Same idea, behind sign-in</div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">7 / 12</div>

<!--
Here's the workflow that makes this approachable:
Start in a spreadsheet. Get your data structure right. Understand what you're building.
THEN move to an app with proper sign-in and security.
Don't try to build the app from scratch - let your spreadsheet be your prototype.
-->

---

# SSO first

<p class="text-slate-400">Secure the app first</p>

<div class="flex gap-12 items-start justify-center mt-8">
  <div class="text-center">
    <div class="text-8xl font-bold text-green-500 leading-none">SSO</div>
    <div class="text-xl text-slate-400 mt-2">before features</div>
  </div>
  <div class="text-left mt-4">
    <p class="text-slate-400 mb-4">Sign-in comes first, then features</p>
    <div class="space-y-3">
      <div><span class="text-green-500 font-bold mr-2">01</span> Google sign-in via Supabase Auth</div>
      <div><span class="text-green-500 font-bold mr-2">02</span> Client secret stays in Supabase Auth, not the front end</div>
      <div><span class="text-green-500 font-bold mr-2">03</span> Row Level Security on your data</div>
    </div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">8 / 12</div>

<!--
I want to emphasize this again: SSO comes BEFORE features.
Don't build cool features and then try to add auth. That's how security bugs happen.
Build the sign-in first. Then add Row Level Security. THEN build features.
-->

---

# Demo: soccer swap fairness engine

<div class="grid grid-cols-4 gap-4 mt-8">
  <div class="bg-green-500 text-slate-900 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">📋</div>
    <div class="font-bold">Roster</div>
    <div class="text-xs opacity-80">The players</div>
  </div>
  <div class="bg-green-500 text-slate-900 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">⚽</div>
    <div class="font-bold">Positions</div>
    <div class="text-xs opacity-80">Who plays where</div>
  </div>
  <div class="bg-green-500 text-slate-900 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">✓</div>
    <div class="font-bold">Attendance</div>
    <div class="text-xs opacity-80">Who is here today</div>
  </div>
  <div class="bg-green-500 text-slate-900 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">🔄</div>
    <div class="font-bold">Swaps</div>
    <div class="text-xs opacity-80">Swap command or drag UI</div>
  </div>
</div>

<p class="text-green-500 text-xl mt-8">Goal: fair play time for every kid</p>

<p class="mt-6">
  <a href="https://dhopkins-va.github.io/dad-soccer/" target="_blank" class="text-green-500 underline">
    → Try the live app: dhopkins-va.github.io/dad-soccer
  </a>
</p>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">9 / 12</div>

<!--
Let me show you the app I built for my soccer team.
Roster management, position tracking, attendance, and the swap system.
The goal is simple: make sure every kid gets fair play time.
Click the link to see it live - this is what you'll build something like today.
-->

---

# Who pays for what

<div class="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-12">
  <div class="text-center">
    <div class="text-slate-400 text-sm mb-2">Claude</div>
    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="text-green-500 font-bold text-xl">Owner</div>
    </div>
    <div class="text-slate-500 text-xs mt-2">Pays the Claude subscription</div>
  </div>
  <div class="text-center">
    <div class="text-slate-400 text-sm mb-2">Supabase</div>
    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="text-green-500 font-bold text-xl">Collab</div>
    </div>
    <div class="text-slate-500 text-xs mt-2">The shared layer for users</div>
  </div>
  <div class="text-center">
    <div class="text-slate-400 text-sm mb-2">Tokens</div>
    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class="text-green-500 font-bold text-xl">Users</div>
    </div>
    <div class="text-slate-500 text-xs mt-2">Spend no Claude tokens</div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">10 / 12</div>

<!--
Let's talk money.
YOU pay for Claude - that's your subscription for building.
Supabase is the shared infrastructure - free tier is generous for small apps.
Your USERS don't spend any Claude tokens - they just use the app you built.
This is sustainable: one subscription, unlimited users on the free tier.
-->

---

# Sample app ideas

<div class="grid grid-cols-3 gap-6 mt-8">
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
    <div class="text-3xl mb-2">📊</div>
    <div class="text-green-500 font-bold">Expense tracker</div>
    <div class="text-slate-400 text-sm mt-2">Built from your receipts</div>
  </div>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
    <div class="text-3xl mb-2">📚</div>
    <div class="text-green-500 font-bold">Study plan</div>
    <div class="text-slate-400 text-sm mt-2">From a syllabus, with voting</div>
  </div>
  <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
    <div class="text-3xl mb-2">🏆</div>
    <div class="text-green-500 font-bold">Coaching app</div>
    <div class="text-slate-400 text-sm mt-2">Like the soccer swap demo</div>
  </div>
</div>

<div class="bg-green-500 text-slate-900 rounded-xl px-8 py-4 mt-8 font-bold inline-block">
  Your turn: build your first real app today
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">11 / 12</div>

<!--
Here are some ideas to get you started.
An expense tracker that you customize for YOUR receipts and categories.
A study plan app for your class, with voting on topics.
Or your own coaching app - any sport, any activity.
The point is: pick something YOU need. Audience of one.
-->

---

# When this beats Excel

<div class="grid grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
  <div>
    <h3 class="text-green-500 mb-4">When to build an app</h3>
    <div class="space-y-3">
      <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
        <div class="text-2xl">👥</div>
        <div>
          <div class="font-bold">Many users</div>
          <div class="text-slate-400 text-xs">Others read and write the same data</div>
        </div>
      </div>
      <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
        <div class="text-2xl">🔐</div>
        <div>
          <div class="font-bold">Secure sign-in</div>
          <div class="text-slate-400 text-xs">Each user signs in with Google</div>
        </div>
      </div>
      <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
        <div class="text-2xl">⚙️</div>
        <div>
          <div class="font-bold">Custom logic</div>
          <div class="text-slate-400 text-xs">Rules like fair play time</div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <h3 class="text-green-500 mb-4">Homework</h3>
    <div class="bg-green-500 text-slate-900 rounded-xl py-8 text-center">
      <div class="font-bold text-xl">Build your own</div>
      <div class="font-bold text-xl">audience-of-one app</div>
    </div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-slate-500">Dale Hopkins</div>
<div class="absolute bottom-4 right-6 text-sm text-slate-500 font-mono">12 / 12</div>

<!--
So when does this beat Excel?
When you have multiple users who need to access the same data.
When you need proper authentication, not just a shared link.
When you have custom logic that's hard to express in formulas.
Your homework: build your own audience-of-one app. Pick something you actually need.
See you next class!
-->
