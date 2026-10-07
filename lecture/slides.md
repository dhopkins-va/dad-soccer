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
class: text-center
highlighter: shiki
lineNumbers: false
colorSchema: dark
---

<style>
:root {
  --slidev-theme-primary: #22c55e;
  --slidev-theme-primary-lightest: #dcfce7;
  --slidev-theme-accent: #22c55e;
}

.slidev-layout {
  background: #0f172a;
  color: #f8fafc;
}

.slidev-layout h1, .slidev-layout h2 {
  color: #22c55e;
}

.slidev-page-1 .my-auto {
  max-width: 100%;
}

.brand-logo {
  width: 48px;
  height: 48px;
  fill: currentColor;
}

.signup-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.signup-column {
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #334155;
}

.signup-column h3 {
  color: #22c55e;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.signup-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.signup-column li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #334155;
  font-size: 0.9rem;
}

.signup-column li:last-child {
  border-bottom: none;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.step-box {
  background: #22c55e;
  color: #0f172a;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.step-box .num {
  font-size: 2rem;
  font-weight: bold;
}

.step-box .title {
  font-weight: 600;
  margin: 0.5rem 0;
}

.step-box .desc {
  font-size: 0.8rem;
  opacity: 0.8;
}

.two-step-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.two-step-box {
  background: #22c55e;
  color: #0f172a;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.two-step-box .num {
  font-size: 2.5rem;
  font-weight: bold;
}

.secrets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.secrets-box {
  background: #1e293b;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.secrets-box.anti {
  background: #7f1d1d;
}

.secrets-box .num {
  font-size: 1.5rem;
  font-weight: bold;
  color: #22c55e;
}

.secrets-box.anti .num {
  color: #fca5a5;
}

.key-line {
  background: #1e293b;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 3rem;
  font-size: 0.9rem;
}

.key-line .good {
  color: #22c55e;
}

.key-line .bad {
  color: #f87171;
}

.sso-big {
  font-size: 8rem;
  font-weight: bold;
  color: #22c55e;
  line-height: 1;
}

.sso-subtitle {
  font-size: 1.5rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.feature-list {
  text-align: left;
  max-width: 400px;
}

.feature-list li {
  padding: 0.5rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.feature-list .num {
  color: #22c55e;
  font-weight: bold;
  min-width: 2rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 2rem 0;
}

.demo-box {
  background: #22c55e;
  color: #0f172a;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.demo-box .icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.demo-box .title {
  font-weight: bold;
}

.demo-box .desc {
  font-size: 0.75rem;
  opacity: 0.8;
}

.goal-text {
  color: #22c55e;
  font-size: 1.25rem;
  margin-top: 1.5rem;
}

.pays-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 800px;
  margin: 2rem auto;
}

.pays-box {
  text-align: center;
}

.pays-box .source {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.pays-box .role {
  background: #1e293b;
  border-radius: 8px;
  padding: 1rem;
  font-weight: bold;
  font-size: 1.25rem;
}

.pays-box .desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.ideas-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.idea-box {
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.idea-box .icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.idea-box .title {
  color: #22c55e;
  font-weight: bold;
}

.idea-box .desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.cta-box {
  background: #22c55e;
  color: #0f172a;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-weight: bold;
  display: inline-block;
  margin-top: 1rem;
}

.excel-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin: 2rem auto;
  max-width: 900px;
}

.excel-col h3 {
  color: #22c55e;
  margin-bottom: 1rem;
}

.excel-item {
  background: #1e293b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.excel-item .icon {
  font-size: 1.5rem;
}

.excel-item .text .title {
  font-weight: bold;
}

.excel-item .text .desc {
  font-size: 0.8rem;
  color: #94a3b8;
}

.homework-box {
  background: #22c55e;
  color: #0f172a;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  font-weight: bold;
  display: inline-block;
}

.attacks-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.attacks-list {
  text-align: left;
}

.attack-item {
  margin-bottom: 1.5rem;
}

.attack-item h4 {
  color: #22c55e;
  margin-bottom: 0.25rem;
}

.attack-item p {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0;
}

.protection-box {
  background: #1e293b;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.protection-box h3 {
  color: #22c55e;
  font-size: 1.5rem;
}

.protection-box p {
  color: #94a3b8;
}
</style>

<!-- Slide 1: In-class signups -->

# In-class signups

<div class="signup-grid">
  <div class="signup-column">
    <h3>
      <img src="/google-cloud.svg" class="brand-logo" style="filter: brightness(0) invert(1);" alt="Google Cloud" />
      Google Cloud
    </h3>
    <ul>
      <li>Free account</li>
      <li>OAuth consent screen</li>
      <li>Testing mode</li>
      <li>Client ID</li>
    </ul>
  </div>
  <div class="signup-column">
    <h3>
      <img src="/supabase.svg" class="brand-logo" style="filter: brightness(0) invert(1);" alt="Supabase" />
      Supabase
    </h3>
    <ul>
      <li>Free account</li>
      <li>One project per student</li>
      <li>Edge Functions secrets</li>
      <li>Row Level Security</li>
    </ul>
  </div>
  <div class="signup-column">
    <h3>
      <img src="/github.svg" class="brand-logo" style="filter: brightness(0) invert(1);" alt="GitHub" />
      GitHub
    </h3>
    <ul>
      <li>Free account</li>
      <li>Student account</li>
    </ul>
  </div>
</div>

<p style="margin-top: 2rem; color: #94a3b8; font-size: 0.9rem;">
  <strong>Claude Code:</strong> assumed already installed
</p>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Welcome everyone! Before we dive in, please make sure you have accounts set up for these three services.
Google Cloud is for OAuth - we'll create a consent screen and get a client ID.
Supabase will handle our authentication and database.
GitHub for version control and deployment.
-->

---
layout: center
---

# Claude as the Next Excel

<h2 style="color: #f8fafc; font-weight: normal;">Build your first <span style="color: #22c55e;">real app</span> today</h2>

<p style="color: #94a3b8; margin-top: 2rem;">Custom software for an audience of one</p>

<p style="color: #64748b; margin-top: 3rem; font-size: 0.9rem;">
  Dale Hopkins
</p>

<p style="color: #475569; font-size: 0.8rem; margin-top: 2rem;">
  Today's tools: the standard, but not the only, options
</p>

<!--
The title says it all - Claude can help you build real applications as easily as you might create a spreadsheet.
The key insight: we're building for an audience of one - yourself, or a very small group with specific needs.
-->

---
layout: center
---

<div style="display: flex; align-items: center; justify-content: center; gap: 3rem;">
  <div style="font-size: 12rem; font-weight: bold; color: #22c55e; line-height: 1;">1</div>
  <div style="text-align: left;">
    <p style="font-size: 1.5rem; color: #94a3b8; margin: 0;">user</p>
  </div>
</div>

<h1 style="margin-top: 2rem;">Audience of one</h1>

<p style="color: #94a3b8;">Apps that would never be built commercially</p>

<div style="background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-top: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
  <p style="color: #22c55e; margin: 0 0 0.5rem 0; font-weight: bold;">Example: rec soccer</p>
  <p style="color: #94a3b8; margin: 0; font-size: 0.9rem;">A father coaching under-10 rec soccer, optimizing fair play time</p>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
This is the magic of audience-of-one apps.
Commercial software needs thousands of users to be viable.
But YOU only need one user - yourself.
My example: I coach my kid's soccer team and wanted to make sure every kid gets fair play time.
No company would build that, but Claude helped me build it in a weekend.
-->

---

# Why SSO first

<p style="color: #94a3b8;">Start with the attacks it stops</p>

<div class="attacks-grid">
  <div class="attacks-list">
    <div class="attack-item">
      <h4>Credential stuffing</h4>
      <p>No app password to reuse or leak</p>
    </div>
    <div class="attack-item">
      <h4>Phishing</h4>
      <p>Credentials only go to Google's sign-in page</p>
    </div>
    <div class="attack-item">
      <h4>Session hijacking</h4>
      <p>Short-lived tokens, not a static key</p>
    </div>
  </div>
  <div class="protection-box">
    <h3>Protection first,</h3>
    <h3>OAuth flow second</h3>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Why do we start with SSO? Because security should come FIRST, not be bolted on later.
Google handles all the hard security stuff - credential stuffing, phishing, token management.
You get enterprise-grade auth for free.
-->

---

# Google sign-in via Supabase

<div class="step-grid">
  <div class="step-box">
    <div class="num">01.</div>
    <div class="title">Google Cloud</div>
    <div class="desc">OAuth consent screen and client ID</div>
  </div>
  <div class="step-box">
    <div class="num">02.</div>
    <div class="title">Supabase Auth</div>
    <div class="desc">Handles the Google sign-in</div>
  </div>
  <div class="step-box">
    <div class="num">03.</div>
    <div class="title">Edge Function</div>
    <div class="desc">Holds the client secret</div>
  </div>
  <div class="step-box">
    <div class="num">04.</div>
    <div class="title">Front end</div>
    <div class="desc">Never sees the secret</div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Here's the four-step flow:
1. Google Cloud gives us the OAuth consent screen and client ID
2. Supabase Auth orchestrates the Google sign-in flow
3. The client SECRET stays in an Edge Function - server-side only
4. Your front-end code never sees the secret - it just works
This is the secure pattern that keeps your app safe.
-->

---

# Keep secrets off the front end

<div class="secrets-grid">
  <div class="secrets-box">
    <div class="num">01</div>
    <div class="title">Users</div>
    <div class="desc" style="color: #94a3b8; font-size: 0.8rem; margin-top: 0.5rem;">Read and write data</div>
  </div>
  <div class="secrets-box">
    <div class="num">02</div>
    <div class="title">Owner</div>
    <div class="desc" style="color: #94a3b8; font-size: 0.8rem; margin-top: 0.5rem;">Alone spends the tokens</div>
  </div>
  <div class="secrets-box anti">
    <div class="num">03</div>
    <div class="title">Anti-pattern</div>
    <div class="desc" style="color: #fca5a5; font-size: 0.8rem; margin-top: 0.5rem;">A static key in the front end</div>
  </div>
</div>

<div class="key-line">
  <span><span class="good">Anon key:</span> public, fine in the client app</span>
  <span>|</span>
  <span><span class="bad">Service role key:</span> never in the client</span>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
This is the cardinal rule: secrets stay server-side.
The anon key is DESIGNED to be public - it's in your JavaScript, and that's fine.
The service role key has full database access - it NEVER goes in client code.
If you see the service role key in your frontend JS, stop and fix it immediately.
-->

---

# From spreadsheet to app

<div class="two-step-grid">
  <div class="two-step-box">
    <div class="num">01.</div>
    <div class="title" style="font-weight: bold; margin-top: 1rem;">Sheet first</div>
    <div class="desc" style="font-size: 0.9rem; margin-top: 0.5rem;">Start from the spreadsheet</div>
  </div>
  <div class="two-step-box">
    <div class="num">02.</div>
    <div class="title" style="font-weight: bold; margin-top: 1rem;">Then a secure app</div>
    <div class="desc" style="font-size: 0.9rem; margin-top: 0.5rem;">Same idea, behind sign-in</div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Here's the workflow that makes this approachable:
Start in a spreadsheet. Get your data structure right. Understand what you're building.
THEN move to an app with proper sign-in and security.
Don't try to build the app from scratch - let your spreadsheet be your prototype.
-->

---

# SSO first

<p style="color: #94a3b8;">Secure the app first</p>

<div style="display: flex; gap: 3rem; align-items: flex-start; justify-content: center; margin-top: 2rem;">
  <div style="text-align: center;">
    <div class="sso-big">SSO</div>
    <div class="sso-subtitle">before features</div>
  </div>
  <div class="feature-list" style="margin-top: 1rem;">
    <p style="color: #94a3b8; margin-bottom: 1rem;">Sign-in comes first, then features</p>
    <ul style="list-style: none; padding: 0;">
      <li><span class="num">01</span> Google sign-in via Supabase Auth</li>
      <li><span class="num">02</span> Client secret stays in an Edge Function</li>
      <li><span class="num">03</span> Row Level Security on your data</li>
    </ul>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
I want to emphasize this again: SSO comes BEFORE features.
Don't build cool features and then try to add auth. That's how security bugs happen.
Build the sign-in first. Then add Row Level Security. THEN build features.
-->

---

# Demo: soccer swap fairness engine

<div class="demo-grid">
  <div class="demo-box">
    <div class="icon">📋</div>
    <div class="title">Roster</div>
    <div class="desc">The players</div>
  </div>
  <div class="demo-box">
    <div class="icon">⚽</div>
    <div class="title">Positions</div>
    <div class="desc">Who plays where</div>
  </div>
  <div class="demo-box">
    <div class="icon">✓</div>
    <div class="title">Attendance</div>
    <div class="desc">Who is here today</div>
  </div>
  <div class="demo-box">
    <div class="icon">🔄</div>
    <div class="title">Swaps</div>
    <div class="desc">Swap command or drag UI</div>
  </div>
</div>

<p class="goal-text">Goal: fair play time for every kid</p>

<p style="margin-top: 2rem;">
  <a href="https://dhopkins-va.github.io/dad-soccer/" target="_blank" style="color: #22c55e; text-decoration: underline;">
    → Try the live app: dhopkins-va.github.io/dad-soccer
  </a>
</p>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Let me show you the app I built for my soccer team.
Roster management, position tracking, attendance, and the swap system.
The goal is simple: make sure every kid gets fair play time.
Click the link to see it live - this is what you'll build something like today.
-->

---

# Who pays for what

<div class="pays-grid">
  <div class="pays-box">
    <div class="source">Claude</div>
    <div class="role" style="color: #22c55e;">Owner</div>
    <div class="desc">Pays the Claude subscription</div>
  </div>
  <div class="pays-box">
    <div class="source">Supabase</div>
    <div class="role" style="color: #22c55e;">Collab</div>
    <div class="desc">The shared layer for users</div>
  </div>
  <div class="pays-box">
    <div class="source">Tokens</div>
    <div class="role" style="color: #22c55e;">Users</div>
    <div class="desc">Spend no Claude tokens</div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Let's talk money.
YOU pay for Claude - that's your subscription for building.
Supabase is the shared infrastructure - free tier is generous for small apps.
Your USERS don't spend any Claude tokens - they just use the app you built.
This is sustainable: one subscription, unlimited users on the free tier.
-->

---

# Sample app ideas

<div class="ideas-grid">
  <div class="idea-box">
    <div class="icon">📊</div>
    <div class="title">Expense tracker</div>
    <div class="desc">Built from your receipts</div>
  </div>
  <div class="idea-box">
    <div class="icon">📚</div>
    <div class="title">Study plan</div>
    <div class="desc">From a syllabus, with voting</div>
  </div>
  <div class="idea-box">
    <div class="icon">🏆</div>
    <div class="title">Coaching app</div>
    <div class="desc">Like the soccer swap demo</div>
  </div>
</div>

<div class="cta-box">Your turn: build your first real app today</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
Here are some ideas to get you started.
An expense tracker that you customize for YOUR receipts and categories.
A study plan app for your class, with voting on topics.
Or your own coaching app - any sport, any activity.
The point is: pick something YOU need. Audience of one.
-->

---

# When this beats Excel

<div class="excel-grid">
  <div class="excel-col">
    <h3>When to build an app</h3>
    <div class="excel-item">
      <div class="icon">👥</div>
      <div class="text">
        <div class="title">Many users</div>
        <div class="desc">Others read and write the same data</div>
      </div>
    </div>
    <div class="excel-item">
      <div class="icon">🔐</div>
      <div class="text">
        <div class="title">Secure sign-in</div>
        <div class="desc">Each user signs in with Google</div>
      </div>
    </div>
    <div class="excel-item">
      <div class="icon">⚙️</div>
      <div class="text">
        <div class="title">Custom logic</div>
        <div class="desc">Rules like fair play time</div>
      </div>
    </div>
  </div>
  <div class="excel-col">
    <h3>Homework</h3>
    <div class="homework-box">
      Build your own<br/>audience-of-one app
    </div>
  </div>
</div>

<div class="absolute bottom-4 left-4 text-sm text-gray-500">Dale Hopkins</div>

<!--
So when does this beat Excel?
When you have multiple users who need to access the same data.
When you need proper authentication, not just a shared link.
When you have custom logic that's hard to express in formulas.
Your homework: build your own audience-of-one app. Pick something you actually need.
See you next class!
-->
